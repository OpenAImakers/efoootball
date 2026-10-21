import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Navbar from "../../components/ExternalHeader";

export type PredictionChoice = '1' | 'X' | '2';
type TierKey = 5 | 6 | 7;
type PopupVariant = 'info' | 'success' | 'error' | 'warning';

interface JackpotGame {
    id: string;
    game_number: number;
    home_team: string;
    away_team: string;
    match_time?: string | null;
    status: string;
}

interface Jackpot {
    id: string;
    name: string;
    game_count: number;
    entry_fee: number;
    prize_amount: number | null;
    status: string;
    jackpot_games: JackpotGame[];
}

interface TierConfig {
    key: TierKey;
    title: string;
    entryFee: number;
    prize: number;
    color: string;
    badgeBg: string;
}

interface PopupState {
    visible: boolean;
    title: string;
    message: string;
    variant: PopupVariant;
    actions?: { label: string; onClick: () => void; secondary?: boolean }[];
}

const TIER_CONFIGS: TierConfig[] = [
    { key: 5, title: 'Contest 5', entryFee: 25, prize: 2500, color: '#0EA5E9', badgeBg: 'rgba(14, 165, 233, 0.15)' },
    { key: 6, title: 'Contest 6', entryFee: 30, prize: 5000, color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
    { key: 7, title: 'Contest 7', entryFee: 50, prize: 10000, color: '#EC4899', badgeBg: 'rgba(236, 72, 153, 0.15)' },
];

const SELECTION_MAP: Record<PredictionChoice, 'HOME' | 'DRAW' | 'AWAY'> = {
    '1': 'HOME',
    'X': 'DRAW',
    '2': 'AWAY',
};

const DOWNLOAD_URL = 'https://github.com/Newton-oyweri/rankings-app/releases/download/v0.1/Rankings.apk';

const POPUP_COLORS: Record<PopupVariant, { bg: string; fg: string; icon: string }> = {
    success: { bg: 'rgba(34,197,94,0.15)', fg: '#4ade80', icon: 'bi-check-circle-fill' },
    error: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171', icon: 'bi-exclamation-circle-fill' },
    warning: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', icon: 'bi-exclamation-triangle-fill' },
    info: { bg: 'rgba(56,189,248,0.15)', fg: '#38bdf8', icon: 'bi-info-circle-fill' },
};

const FootballTab: React.FC = () => {
    const navigate = useNavigate();

    const [selectedTier, setSelectedTier] = useState<TierKey>(7);
    const [jackpotsMap, setJackpotsMap] = useState<Record<number, Jackpot>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [predictions, setPredictions] = useState<Record<string, PredictionChoice>>({});
    const [submitting, setSubmitting] = useState(false);
    const [popup, setPopup] = useState<PopupState>({
        visible: false,
        title: '',
        message: '',
        variant: 'info',
    });

    const showPopup = (config: Omit<PopupState, 'visible'>) => setPopup({ ...config, visible: true });
    const dismissPopup = () => setPopup((p) => ({ ...p, visible: false }));

    const fetchJackpots = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('jackpots')
                .select(`
          id,
          name,
          game_count,
          entry_fee,
          prize_amount,
          status,
          jackpot_games (
            id,
            game_number,
            home_team,
            away_team,
            match_time,
            status
          )
        `)
                .eq('status', 'open');

            if (error) {
                console.error('Error fetching jackpots:', error.message);
                return;
            }

            if (data) {
                const mapped: Record<number, Jackpot> = {};
                data.forEach((j: any) => {
                    const sortedGames = (j.jackpot_games || []).sort(
                        (a: JackpotGame, b: JackpotGame) => a.game_number - b.game_number
                    );
                    mapped[j.game_count] = { ...j, jackpot_games: sortedGames } as Jackpot;
                });
                setJackpotsMap(mapped);
            }
        } catch (err) {
            console.error('Error in fetchJackpots:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJackpots();
    }, [fetchJackpots]);

    // Reset expanded + picks when tier changes (picks belong to a specific tier's games)
    useEffect(() => {
        setExpandedIds(new Set());
        setPredictions({});
    }, [selectedTier]);

    const activeConfig = TIER_CONFIGS.find((t) => t.key === selectedTier)!;
    const activeJackpot = jackpotsMap[selectedTier];
    const currentMatches = activeJackpot?.jackpot_games || [];

    const selectedCount = currentMatches.filter((m) => predictions[m.id]).length;
    const isComplete = currentMatches.length > 0 && selectedCount === currentMatches.length;

    const formattedMatchTime = (matchTime?: string | null) => {
        if (!matchTime) return 'TBD';
        return new Date(matchTime).toLocaleDateString(undefined, {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpandedIds(new Set(currentMatches.map((m) => m.id)));
    const collapseAll = () => setExpandedIds(new Set());

    const handlePick = (gameId: string, choice: PredictionChoice) => {
        setPredictions((prev) => {
            const next = { ...prev };
            if (next[gameId] === choice) delete next[gameId];
            else next[gameId] = choice;
            return next;
        });
    };

    // ---------- Submit ----------
    const handleSubmit = async () => {
        // 1. Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }

        if (!activeJackpot) {
            showPopup({
                title: 'Unavailable',
                message: 'This contest is not currently open. Please try another tier.',
                variant: 'warning',
            });
            return;
        }

        if (!isComplete) {
            showPopup({
                title: 'Incomplete Picks',
                message: `Pick a result for all ${currentMatches.length} fixtures before submitting. You have ${selectedCount} so far.`,
                variant: 'warning',
            });
            return;
        }

        setSubmitting(true);

        try {
            // Duplicate-entry guard
            const { data: existing, error: existingError } = await supabase
                .from('jackpot_entries')
                .select('id, entry_number')
                .eq('jackpot_id', activeJackpot.id)
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle();

            if (existingError) throw existingError;

            if (existing) {
                showPopup({
                    title: 'Already Entered',
                    message: `You've already placed an entry in ${activeConfig.title} (Entry #${existing.entry_number}). Each player can enter this contest only once.`,
                    variant: 'warning',
                });
                return;
            }

            // Deduct entry fee (atomic, server-side)
            const feeReference = `jkp_${activeJackpot.id.slice(0, 8)}_${user.id.slice(0, 8)}_${Date.now()}`;

            const { data: deductResult, error: deductError } = await supabase.rpc(
                'deduct_jackpot_entry_fee',
                {
                    p_user_id: user.id,
                    p_jackpot_id: activeJackpot.id,
                    p_reference: feeReference,
                }
            );

            if (deductError) throw deductError;

            if (deductResult === 'INSUFFICIENT_BALANCE') {
                showPopup({
                    title: 'Insufficient Balance',
                    message: `You need KSh ${activeConfig.entryFee} to enter ${activeConfig.title}. Top up your wallet to continue.`,
                    variant: 'warning',
                    actions: [
                        { label: 'Cancel', onClick: dismissPopup, secondary: true },
                        { label: 'Deposit', onClick: () => { dismissPopup(); navigate('/deposit'); } },
                    ],
                });
                return;
            }

            if (deductResult === 'WALLET_NOT_FOUND') {
                showPopup({
                    title: 'Wallet Not Found',
                    message: 'We could not find your wallet. Please sign out and sign in again, or contact support.',
                    variant: 'error',
                });
                return;
            }

            if (deductResult === 'JACKPOT_NOT_OPEN') {
                showPopup({
                    title: 'Contest Closed',
                    message: 'This contest is no longer accepting entries. Please try another tier.',
                    variant: 'warning',
                });
                return;
            }

            if (deductResult !== 'SUCCESS') {
                showPopup({
                    title: 'Could Not Process',
                    message: 'Something went wrong charging your entry fee. Please try again.',
                    variant: 'error',
                });
                return;
            }

            // Fee charged. Create entry.
            const { data: entryData, error: entryError } = await supabase
                .from('jackpot_entries')
                .insert({
                    jackpot_id: activeJackpot.id,
                    user_id: user.id,
                    entry_number: 1,
                    entry_fee: activeConfig.entryFee,
                    status: 'submitted',
                })
                .select('id')
                .single();

            if (entryError) throw entryError;

            // Insert selections
            const selectionsPayload = currentMatches.map((match) => ({
                entry_id: entryData.id,
                game_id: match.id,
                selection: SELECTION_MAP[predictions[match.id]],
            }));

            const { error: selectionsError } = await supabase
                .from('jackpot_selections')
                .insert(selectionsPayload);

            if (selectionsError) throw selectionsError;

            showPopup({
                title: 'Entry Placed! 🎉',
                message: `Your ${activeConfig.title} predictions have been submitted. Good luck!`,
                variant: 'success',
            });

            setPredictions({});
            setExpandedIds(new Set());
        } catch (error: any) {
            console.error('Submission failed:', error);

            if (
                error?.code === '23505' ||
                /duplicate key|unique constraint/i.test(error?.message ?? '')
            ) {
                showPopup({
                    title: 'Already Entered',
                    message: `You've already placed an entry in ${activeConfig.title}. Each player can enter this contest only once.`,
                    variant: 'warning',
                });
            } else {
                showPopup({
                    title: 'Submission Failed',
                    message: error?.message || 'Unable to place your entry. Please try again.',
                    variant: 'error',
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.spinner} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const popupColor = POPUP_COLORS[popup.variant];

    return (
        <>
            <Navbar />

            <div style={styles.pageWrapper}>
                {/* Hero with download icon next to the title */}
                <div style={styles.heroSection}>
                    <a
                        href={DOWNLOAD_URL}
                        download="Rankings.apk"
                        rel="noopener noreferrer"
                        style={styles.heroLink}
                    >
                        <div style={styles.heroContent}>
                            <div style={styles.heroTitleRow}>
                                <h1 style={styles.heroTitle}>Contest Predictions</h1>
                                <span
                                    style={{
                                        ...styles.heroDownloadIcon,
                                        color: activeConfig.color,
                                        borderColor: `${activeConfig.color}66`,
                                        backgroundColor: `${activeConfig.color}1F`,
                                    }}
                                >
                                    <i className="bi bi-download" />
                                </span>
                            </div>
                            <p style={{ ...styles.heroSubtitle, color: activeConfig.color }}>
                                Download Rankings App Now!
                            </p>
                        </div>
                    </a>
                </div>

                <div style={styles.container}>
                    {/* Tier pills */}
                    <div style={styles.tierRow}>
                        {TIER_CONFIGS.map((tier) => {
                            const isActive = selectedTier === tier.key;
                            return (
                                <button
                                    key={tier.key}
                                    style={{
                                        ...styles.tierChip,
                                        ...(isActive && {
                                            backgroundColor: tier.color,
                                            borderColor: tier.color,
                                            boxShadow: `0 8px 24px ${tier.color}40`,
                                        }),
                                    }}
                                    onClick={() => setSelectedTier(tier.key)}
                                >
                                    <span style={styles.tierTitle}>{tier.title}</span>
                                    <span style={styles.tierPrize}>KSh {tier.prize.toLocaleString()}</span>
                                    <span style={styles.tierFee}>KSh {tier.entryFee}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Banner */}
                    <div
                        style={{
                            ...styles.bannerCard,
                            borderColor: activeConfig.color,
                            background: `linear-gradient(90deg, #1E1B4B 0%, ${activeConfig.color}18 100%)`,
                        }}
                    >
                        <div style={styles.bannerLeft}>
                            <span
                                style={{
                                    ...styles.bannerBadge,
                                    backgroundColor: activeConfig.badgeBg,
                                    color: activeConfig.color,
                                }}
                            >
                                {activeConfig.title}
                            </span>
                            <span style={styles.bannerPrize}>
                                <i className="bi bi-trophy-fill" style={{ marginRight: 6, color: activeConfig.color }} />
                                KSh {activeConfig.prize.toLocaleString()}
                            </span>
                        </div>
                        <div style={styles.bannerRight}>
                            <span style={styles.bannerMeta}>
                                {currentMatches.length} fixtures · Entry KSh {activeConfig.entryFee}
                            </span>
                        </div>
                    </div>

                    {/* Progress */}
                    {currentMatches.length > 0 && (
                        <div style={styles.progressRow}>
                            <span style={styles.progressText}>
                                Predictions: {selectedCount} / {currentMatches.length}
                            </span>
                            <span style={{ ...styles.progressStatus, color: activeConfig.color }}>
                                {isComplete
                                    ? 'Ready to play!'
                                    : `Pick ${currentMatches.length - selectedCount} more`}
                            </span>
                        </div>
                    )}

                    {/* Section header */}
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>All {activeConfig.key} Fixtures</h3>
                        {currentMatches.length > 0 && (
                            <div style={styles.expandControls}>
                                <button type="button" style={styles.controlBtn} onClick={expandAll}>
                                    Expand all
                                </button>
                                <button type="button" style={styles.controlBtn} onClick={collapseAll}>
                                    Collapse
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Fixtures */}
                    <div style={styles.fixturesContainer}>
                        {currentMatches.length === 0 ? (
                            <div style={styles.emptyCard}>
                                <div style={styles.emptyTitle}>No matches updated yet</div>
                                <div style={styles.emptySubtext}>
                                    No scheduled fixtures for {activeConfig.title}. Check back later.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={styles.matchList}>
                                    {currentMatches.map((match) => {
                                        const isOpen = expandedIds.has(match.id);
                                        const pick = predictions[match.id];
                                        return (
                                            <div
                                                key={match.id}
                                                style={{
                                                    ...styles.matchRow,
                                                    ...(isOpen && styles.matchRowOpen),
                                                    ...(pick && { borderColor: `${activeConfig.color}66` }),
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    style={styles.matchRowBtn}
                                                    onClick={() => toggleExpand(match.id)}
                                                    aria-expanded={isOpen}
                                                >
                                                    <span style={styles.matchNum}>{match.game_number}</span>
                                                    <span style={styles.matchTeams}>
                                                        <span style={styles.home}>{match.home_team}</span>
                                                        <span style={styles.vs}>vs</span>
                                                        <span style={styles.away}>{match.away_team}</span>
                                                    </span>
                                                    {pick ? (
                                                        <span
                                                            style={{
                                                                ...styles.pickBadge,
                                                                backgroundColor: activeConfig.color,
                                                            }}
                                                        >
                                                            {pick}
                                                        </span>
                                                    ) : (
                                                        <span style={styles.matchTime}>
                                                            {formattedMatchTime(match.match_time)}
                                                        </span>
                                                    )}
                                                    <span style={styles.chevron}>
                                                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} />
                                                    </span>
                                                </button>

                                                {isOpen && (
                                                    <div style={styles.matchDetails}>
                                                        <div style={styles.picksRow}>
                                                            {(['1', 'X', '2'] as PredictionChoice[]).map((choice) => {
                                                                const active = pick === choice;
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={choice}
                                                                        onClick={() => handlePick(match.id, choice)}
                                                                        style={{
                                                                            ...styles.pickButton,
                                                                            ...(active && {
                                                                                backgroundColor: activeConfig.color,
                                                                                borderColor: activeConfig.color,
                                                                            }),
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                ...styles.pickText,
                                                                                ...(active && { color: '#fff' }),
                                                                            }}
                                                                        >
                                                                            {choice === '1'
                                                                                ? '1 (Home)'
                                                                                : choice === 'X'
                                                                                ? 'X (Draw)'
                                                                                : '2 (Away)'}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div style={styles.detailMeta}>
                                                            <i className="bi bi-clock" style={{ marginRight: 4 }} />
                                                            Kick-off: {formattedMatchTime(match.match_time)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Submit CTA */}
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className={isComplete && !submitting ? 'cta-shake' : ''}
                                    style={{
                                        ...styles.submitButton,
                                        backgroundColor: activeConfig.color,
                                        boxShadow: `0 10px 30px ${activeConfig.color}66`,
                                        opacity: isComplete ? 1 : 0.6,
                                        cursor: submitting ? 'wait' : 'pointer',
                                    }}
                                >
                                    <span style={styles.submitText}>
                                        {submitting ? (
                                            <span style={styles.btnSpinner} />
                                        ) : (
                                            <>
                                                <i className="bi bi-send-fill" style={styles.submitIcon} />
                                                {isComplete
                                                    ? `Submit ${activeConfig.title} (KSh ${activeConfig.entryFee})`
                                                    : `Pick ${currentMatches.length - selectedCount} more to submit`}
                                            </>
                                        )}
                                    </span>
                                </button>

                                <div style={styles.infoMessage}>
                                    <i className="bi bi-info-circle-fill" style={{ marginRight: 8 }} />
                                    Sponsored by Wonderbakes
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Popup */}
            {popup.visible && (
                <div style={styles.popupOverlay} onClick={dismissPopup}>
                    <div style={styles.popupCard} onClick={(e) => e.stopPropagation()}>
                        <div style={{ ...styles.popupIconCircle, backgroundColor: popupColor.bg }}>
                            <i className={`bi ${popupColor.icon}`} style={{ color: popupColor.fg, fontSize: 26 }} />
                        </div>
                        <div style={styles.popupTitle}>{popup.title}</div>
                        <div style={styles.popupMessage}>{popup.message}</div>
                        <div style={styles.popupActions}>
                            {(popup.actions && popup.actions.length > 0
                                ? popup.actions
                                : [{ label: 'OK', onClick: dismissPopup, secondary: false }]
                            ).map((a, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={a.onClick}
                                    style={{
                                        ...styles.popupButton,
                                        ...(a.secondary ? styles.popupButtonSecondary : styles.popupButtonPrimary),
                                    }}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Still for most of the cycle, then a quick shake */
                @keyframes ctaShake {
                    0%, 72%, 100% { transform: translateX(0) rotate(0deg) scale(1); }
                    74% { transform: translateX(-7px) rotate(-1.5deg) scale(1.03); }
                    78% { transform: translateX(7px) rotate(1.5deg) scale(1.03); }
                    82% { transform: translateX(-6px) rotate(-1deg) scale(1.03); }
                    86% { transform: translateX(6px) rotate(1deg) scale(1.03); }
                    90% { transform: translateX(-3px) rotate(-0.5deg) scale(1.02); }
                    94% { transform: translateX(3px) rotate(0.5deg) scale(1.01); }
                }

                .cta-shake {
                    animation: ctaShake 4s ease-in-out infinite;
                    transform-origin: center;
                }

                @media (prefers-reduced-motion: reduce) {
                    .cta-shake { animation: none; }
                }
            `}</style>
        </>
    );
};

const styles: Record<string, React.CSSProperties> = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030A1A 0%, #0A1A3A 50%, #1A0A2A 100%)',
        paddingTop: '150px',
    },
    heroSection: {
        background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '24px 16px 16px',
        textAlign: 'center',
    },
    heroLink: {
        textDecoration: 'none',
        display: 'block',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    heroTitleRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    heroTitle: {
        fontSize: '1.75rem',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    heroDownloadIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        border: '1.5px solid',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
    },
    heroSubtitle: {
        fontSize: '0.875rem',
        marginTop: 6,
        marginBottom: 0,
        fontWeight: 700,
    },
    container: {
        maxWidth: '720px',
        margin: '0 auto',
        padding: '16px 12px 48px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    centerContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#030A1A',
    },
    spinner: {
        width: 44,
        height: 44,
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid #0EA5E9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    btnSpinner: {
        width: 22,
        height: 22,
        border: '3px solid rgba(255, 255, 255, 0.35)',
        borderTop: '3px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
    },

    tierRow: {
        display: 'flex',
        gap: 10,
        padding: '12px 0 16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    tierChip: {
        padding: '10px 14px',
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        minWidth: 110,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#fff',
    },
    tierTitle: {
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        opacity: 0.9,
    },
    tierPrize: {
        fontSize: 16,
        fontWeight: 900,
        letterSpacing: '-0.3px',
    },
    tierFee: {
        fontSize: 11,
        opacity: 0.55,
        fontWeight: 500,
    },

    bannerCard: {
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 14,
        borderWidth: 1.5,
        borderStyle: 'solid',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    bannerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    bannerBadge: {
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        padding: '3px 8px',
        borderRadius: 6,
    },
    bannerPrize: {
        fontSize: 18,
        fontWeight: 900,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
    },
    bannerRight: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: 600,
    },
    bannerMeta: {
        whiteSpace: 'nowrap',
    },

    progressRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 4px 6px',
    },
    progressText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 600,
    },
    progressStatus: {
        fontSize: 12,
        fontWeight: 700,
    },

    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '8px 0 10px',
        gap: 12,
        flexWrap: 'wrap',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 700,
        color: '#fff',
        margin: 0,
        letterSpacing: '0.3px',
    },
    expandControls: {
        display: 'flex',
        gap: 6,
    },
    controlBtn: {
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 8,
        cursor: 'pointer',
    },

    fixturesContainer: {
        width: '100%',
    },
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '32px 20px',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        textAlign: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#fff',
        marginBottom: 6,
    },
    emptySubtext: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        lineHeight: 1.5,
    },

    matchList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 14,
    },
    matchRow: {
        backgroundColor: 'rgba(255, 255, 255, 0.045)',
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
        transition: 'background 0.15s ease, border-color 0.15s ease',
    },
    matchRowOpen: {
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
    },
    matchRowBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#fff',
        textAlign: 'left',
    },
    matchNum: {
        flexShrink: 0,
        width: 22,
        height: 22,
        borderRadius: 6,
        background: 'rgba(255, 255, 255, 0.08)',
        fontSize: 11,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    matchTeams: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        overflow: 'hidden',
    },
    home: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '42%',
    },
    vs: {
        flexShrink: 0,
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.25)',
        textTransform: 'uppercase',
    },
    away: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '42%',
        textAlign: 'right',
    },
    matchTime: {
        flexShrink: 0,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
    },
    pickBadge: {
        flexShrink: 0,
        minWidth: 24,
        height: 22,
        padding: '0 7px',
        borderRadius: 6,
        color: '#fff',
        fontSize: 12,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevron: {
        flexShrink: 0,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.35)',
        marginLeft: 2,
    },

    matchDetails: {
        padding: '0 12px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    },
    picksRow: {
        display: 'flex',
        gap: 6,
        marginTop: 10,
    },
    pickButton: {
        flex: 1,
        padding: '10px 4px',
        borderRadius: 8,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    pickText: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    detailMeta: {
        marginTop: 8,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        display: 'flex',
        alignItems: 'center',
    },

    submitButton: {
        width: '100%',
        padding: '18px 16px',
        borderRadius: 16,
        border: 'none',
        textAlign: 'center',
        marginBottom: 14,
        display: 'block',
    },
    submitText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 800,
        letterSpacing: '0.2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitIcon: {
        fontSize: 22,
        lineHeight: 1,
        marginRight: 12,
    },
    infoMessage: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        textAlign: 'center',
        fontSize: 12,
        color: '#FBBF24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Popup
    popupOverlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(2, 6, 18, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    popupCard: {
        width: '100%',
        maxWidth: 360,
        background: 'linear-gradient(135deg, #0F1A38, #0A1128)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 18,
        padding: 22,
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    },
    popupIconCircle: {
        width: 56,
        height: 56,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 14px',
    },
    popupTitle: {
        fontSize: 17,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 6,
    },
    popupMessage: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.65)',
        lineHeight: 1.5,
        marginBottom: 20,
    },
    popupActions: {
        display: 'flex',
        gap: 10,
    },
    popupButton: {
        flex: 1,
        padding: '12px 0',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        border: '1px solid transparent',
    },
    popupButtonPrimary: {
        backgroundColor: '#2563EB',
        color: '#fff',
    },
    popupButtonSecondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        color: 'rgba(255, 255, 255, 0.8)',
    },
};

export default FootballTab;