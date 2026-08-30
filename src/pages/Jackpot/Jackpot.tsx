"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import Navbar from "../../components/ExternalHeader";
import FootballTabSEO from './FootballTabSEO';

export type PredictionChoice = '1' | 'X' | '2';

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
    key: 5 | 6 | 7;
    title: string;
    entryFee: number;
    prize: number;
    color: string;
    badgeBg: string;
}

const TIER_CONFIGS: TierConfig[] = [
    {
        key: 5,
        title: 'Contest 5',
        entryFee: 25,
        prize: 2500,
        color: '#0EA5E9',
        badgeBg: 'rgba(14, 165, 233, 0.15)'
    },
    {
        key: 6,
        title: 'Contest 6',
        entryFee: 30,
        prize: 5000,
        color: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.15)'
    },
    {
        key: 7,
        title: 'Contest 7',
        entryFee: 50,
        prize: 10000,
        color: '#EC4899',
        badgeBg: 'rgba(236, 72, 153, 0.15)'
    },
];

const FootballTab: React.FC = () => {
    const [selectedTier, setSelectedTier] = useState<TierKey>(7);
    const [jackpotsMap, setJackpotsMap] = useState<Record<number, Jackpot>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    type TierKey = 5 | 6 | 7;

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
                data.forEach((j) => {
                    const sortedGames = (j.jackpot_games || []).sort(
                        (a, b) => a.game_number - b.game_number
                    );
                    mapped[j.game_count] = {
                        ...j,
                        jackpot_games: sortedGames,
                    } as Jackpot;
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

    // Reset expanded when tier changes
    useEffect(() => {
        setExpandedIds(new Set());
    }, [selectedTier]);

    const activeConfig = TIER_CONFIGS.find((t) => t.key === selectedTier)!;
    const activeJackpot = jackpotsMap[selectedTier];
    const currentMatches = activeJackpot?.jackpot_games || [];

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

    const expandAll = () => {
        setExpandedIds(new Set(currentMatches.map((m) => m.id)));
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    if (loading) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.spinner} />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <FootballTabSEO
                tier={selectedTier}
                prize={activeConfig.prize}
                entryFee={activeConfig.entryFee}
                matchCount={currentMatches.length}
                currentPath="/contests"
                isPreview={true}
            />
            <div style={styles.pageWrapper}>
                <div style={styles.heroSection}>
                    <div style={styles.heroContent}>
                        <h1 style={styles.heroTitle}>Contest Predictions</h1>
                        <p style={styles.heroSubtitle}>Pick your tier · Preview only</p>
                    </div>
                </div>

                <div style={styles.container}>
                    {/* Compact Tier Pills */}
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
                                    onClick={() => setSelectedTier(tier.key as TierKey)}
                                >
                                    <span style={styles.tierTitle}>{tier.title}</span>
                                    <span style={styles.tierPrize}>KSh {tier.prize.toLocaleString()}</span>
                                    <span style={styles.tierFee}>KSh {tier.entryFee}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Slim Banner */}
                    <div style={{
                        ...styles.bannerCard,
                        borderColor: activeConfig.color,
                        background: `linear-gradient(90deg, #1E1B4B 0%, ${activeConfig.color}18 100%)`,
                    }}>
                        <div style={styles.bannerLeft}>
                            <span style={{
                                ...styles.bannerBadge,
                                backgroundColor: activeConfig.badgeBg,
                                color: activeConfig.color,
                            }}>
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

                    {/* Section + Expand controls */}
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>
                            All {activeConfig.key} Fixtures
                        </h3>
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

                    {/* Compact Fixtures List */}
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
                                        return (
                                            <div
                                                key={match.id}
                                                style={{
                                                    ...styles.matchRow,
                                                    ...(isOpen && styles.matchRowOpen),
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    style={styles.matchRowBtn}
                                                    onClick={() => toggleExpand(match.id)}
                                                    aria-expanded={isOpen}
                                                >
                                                    <span style={styles.matchNum}>
                                                        {match.game_number}
                                                    </span>
                                                    <span style={styles.matchTeams}>
                                                        <span style={styles.home}>{match.home_team}</span>
                                                        <span style={styles.vs}>vs</span>
                                                        <span style={styles.away}>{match.away_team}</span>
                                                    </span>
                                                    <span style={styles.matchTime}>
                                                        {formattedMatchTime(match.match_time)}
                                                    </span>
                                                    <span style={styles.chevron}>
                                                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} />
                                                    </span>
                                                </button>

                                                {isOpen && (
                                                    <div style={styles.matchDetails}>
                                                        <div style={styles.picksRow}>
                                                            {(['1', 'X', '2'] as PredictionChoice[]).map((choice) => (
                                                                <div
                                                                    key={choice}
                                                                    style={styles.pickButton}
                                                                >
                                                                    <span style={styles.pickText}>
                                                                        {choice === '1' ? '1 (Home)' : choice === 'X' ? 'X (Draw)' : '2 (Away)'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={styles.detailMeta}>
                                                            <i className="bi bi-clock" style={{ marginRight: 4 }} />
                                                            Kick-off: {formattedMatchTime(match.match_time) || 'TBD'} bel
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Preview CTA */}
                                <div
                                    style={{
                                        ...styles.submitButton,
                                        backgroundColor: activeConfig.color,
                                        opacity: 0.55,
                                        cursor: 'default',
                                    }}
                                >
                                    <span style={styles.submitText}>
                                        <i className="bi bi-send-fill" style={{ marginRight: 8 }} />
                                        Submit {activeConfig.title} (KSh {activeConfig.entryFee})
                                    </span>
                                </div>

                                <div style={styles.infoMessage}>
                                    <i className="bi bi-info-circle-fill" style={{ marginRight: 8 }} />
                                    Preview only · Place predictions in the mobile app
                                </div>
                            </>
                        )}
                    </div>

                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        </>
    );
};

// Styles – compact & screenshot-friendly
const styles: Record<string, React.CSSProperties> = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030A1A 0%, #0A1A3A 50%, #1A0A2A 100%)',
        paddingTop: '80px',
    },
    heroSection: {
        background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '24px 16px 16px',
        textAlign: 'center',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    heroTitle: {
        fontSize: '1.75rem',
        fontWeight: '900',
        background: 'linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    heroSubtitle: {
        fontSize: '0.875rem',
        color: 'rgba(255, 255, 255, 0.55)',
        marginTop: 4,
        fontWeight: '400',
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

    // Tiers – compact pills
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

    // Banner – single line
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

    // Section header + controls
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

    // Compact match list
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
        transition: 'background 0.15s ease',
    },
    matchRowOpen: {
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
    chevron: {
        flexShrink: 0,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.35)',
        marginLeft: 2,
    },

    // Expanded details
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
        padding: '8px 4px',
        borderRadius: 8,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        cursor: 'default',
    },
    pickText: {
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.45)',
    },
    detailMeta: {
        marginTop: 8,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        display: 'flex',
        alignItems: 'center',
    },

    // CTA + info
    submitButton: {
        padding: '12px',
        borderRadius: 12,
        textAlign: 'center',
        marginBottom: 12,
    },
    submitText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
};

export default FootballTab;
