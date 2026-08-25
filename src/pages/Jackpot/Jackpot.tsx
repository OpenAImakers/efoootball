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
                        <p style={styles.heroSubtitle}>Pick your tier and predict all fixtures</p>
                    </div>
                </div>

                <div style={styles.container}>
                    {/* Tier Selection Cards - TILTED */}
                    <div style={styles.tierRow}>
                        {TIER_CONFIGS.map((tier, index) => {
                            const isActive = selectedTier === tier.key;
                            const tiltDirection = index === 0 ? -3 : index === 1 ? 0 : 3;
                            return (
                                <button
                                    key={tier.key}
                                    style={{
                                        ...styles.tierChip,
                                        ...(isActive && {
                                            backgroundColor: tier.color,
                                            borderColor: tier.color,
                                            transform: `rotate(${tiltDirection}deg) scale(1.05)`,
                                            boxShadow: `0 20px 60px ${tier.color}40`,
                                        }),
                                        ...(!isActive && {
                                            transform: `rotate(${tiltDirection}deg)`,
                                        }),
                                    }}
                                    onClick={() => setSelectedTier(tier.key as TierKey)}
                                >
                                    <div style={styles.tierChipInner}>
                                        <div style={{
                                            ...styles.tierBadge,
                                            backgroundColor: tier.badgeBg,
                                            color: tier.color,
                                        }}>
                                            {tier.title}
                                        </div>
                                        <div style={styles.tierPrize}>
                                            KSh {tier.prize.toLocaleString()}
                                        </div>
                                        <div style={styles.tierFee}>
                                            Entry: KSh {tier.entryFee}
                                        </div>
                                        {isActive && (
                                            <div style={styles.tierActiveIndicator}>
                                                <i className="bi bi-check-circle-fill" style={{ marginRight: '4px' }}></i>
                                                Active
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Banner Header */}
                    <div style={{
                        ...styles.bannerCard,
                        borderColor: activeConfig.color,
                        background: `linear-gradient(135deg, #1E1B4B 0%, ${activeConfig.color}22 100%)`,
                    }}>
                        <div style={styles.bannerHeader}>
                            <div>
                                <div style={{
                                    ...styles.badgeContainer,
                                    backgroundColor: activeConfig.badgeBg,
                                }}>
                                    <span style={{
                                        ...styles.bannerBadge,
                                        color: activeConfig.color,
                                    }}>
                                        {activeConfig.title}
                                    </span>
                                </div>
                                <div style={styles.bannerTarget}>
                                    <i className="bi bi-trophy-fill" style={{ marginRight: '8px', color: activeConfig.color }}></i>
                                    KSh {activeConfig.prize.toLocaleString()}
                                </div>
                            </div>
                            <div style={styles.entryBox}>
                                <div style={styles.entryLabel}>Entry Fee</div>
                                <div style={{
                                    ...styles.entryPrice,
                                    color: activeConfig.color,
                                }}>
                                    KSh {activeConfig.entryFee}
                                </div>
                            </div>
                        </div>

                        <div style={styles.progressRow}>
                            <div style={styles.progressText}>
                                <i className="bi bi-list-ul" style={{ marginRight: '6px' }}></i>
                                {currentMatches.length > 0 ? `${currentMatches.length} Fixtures` : 'No Fixtures'}
                            </div>
                            <div style={{
                                ...styles.progressStatus,
                                color: activeConfig.color,
                            }}>
                                {currentMatches.length === 0
                                    ? 'No Fixtures Available'
                                    : `${currentMatches.length} matches to predict`}
                            </div>
                        </div>
                    </div>

                    {/* Match Fixtures Section */}
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>
                            Predict All {activeConfig.key} Fixtures
                        </h3>
                    </div>

                    {/* Fixtures Display */}
                    <div style={styles.fixturesContainer}>
                        {currentMatches.length === 0 ? (
                            <div style={styles.emptyCard}>
                                <div style={styles.emptyTitle}>No matches updated yet</div>
                                <div style={styles.emptySubtext}>
                                    There are currently no scheduled fixtures for {activeConfig.title}. Check back later.
                                </div>
                            </div>
                        ) : (
                            <>
                                {currentMatches.map((match) => (
                                    <div key={match.id} style={styles.matchCard}>
                                        <div style={styles.matchHeader}>
                                            <span style={styles.matchIndex}>
                                                <i className="bi bi-calendar-event" style={{ marginRight: '6px' }}></i>
                                                Game {match.game_number}
                                            </span>
                                            <span style={styles.matchKickoff}>
                                                <i className="bi bi-clock" style={{ marginRight: '4px' }}></i>
                                                {formattedMatchTime(match.match_time)}
                                            </span>
                                        </div>

                                        <div style={styles.teamsRow}>
                                            <span style={styles.teamText}>{match.home_team}</span>
                                            <span style={styles.vsBadge}>VS</span>
                                            <span style={{ ...styles.teamText, textAlign: 'right' }}>
                                                {match.away_team}
                                            </span>
                                        </div>

                                        {/* 1 X 2 Selection Row - DISPLAY ONLY */}
                                        <div style={styles.picksRow}>
                                            {(['1', 'X', '2'] as PredictionChoice[]).map((choice) => (
                                                <div
                                                    key={choice}
                                                    style={{
                                                        ...styles.pickButton,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                        borderColor: 'rgba(255, 255, 255, 0.08)',
                                                    }}
                                                >
                                                    <span style={styles.pickText}>
                                                        {choice === '1' ? '1 (Home)' : choice === 'X' ? 'X (Draw)' : '2 (Away)'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Submit Button - DISPLAY ONLY */}
                                <div
                                    style={{
                                        ...styles.submitButton,
                                        backgroundColor: activeConfig.color,
                                        opacity: 0.6,
                                        cursor: 'default',
                                    }}
                                >
                                    <span style={styles.submitText}>
                                        <i className="bi bi-send-fill" style={{ marginRight: '8px' }}></i>
                                        {currentMatches.length > 0
                                            ? `Submit ${activeConfig.title} (KSh ${activeConfig.entryFee})`
                                            : `Complete All ${activeConfig.key} Picks`}
                                    </span>
                                </div>

                                {/* Info Message */}
                                <div style={styles.infoMessage}>
                                    <i className="bi bi-info-circle-fill" style={{ marginRight: '8px' }}></i>
                                    This is a preview only. To place predictions, please use the mobile app.
                                </div>
                            </>
                        )}
                    </div>

                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes float {
                            0%, 100% { transform: translateY(0px); }
                            50% { transform: translateY(-10px); }
                        }
                    `}</style>
                </div>
            </div>
        </>
    );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030A1A 0%, #0A1A3A 50%, #1A0A2A 100%)',
        paddingTop: '80px',
    },
    heroSection: {
        background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '40px 20px 20px',
        textAlign: 'center',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    heroTitle: {
        fontSize: '2.5rem',
        fontWeight: '900',
        background: 'linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        letterSpacing: '-1px',
    },
    heroSubtitle: {
        fontSize: '1rem',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: '8px',
        fontWeight: '400',
    },
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px 16px 60px',
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
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderTop: '4px solid #0EA5E9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    sectionHeader: {
        margin: '20px 0 12px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#FFFFFF',
        margin: 0,
        letterSpacing: '0.5px',
    },
    tierRow: {
        display: 'flex',
        gap: '20px',
        padding: '30px 0',
        justifyContent: 'center',
        flexWrap: 'wrap',
        perspective: '1000px',
    },
    tierChip: {
        padding: '24px 20px',
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        minWidth: '180px',
        flex: '0 1 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
    },
    tierChipInner: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        zIndex: 1,
    },
    tierBadge: {
        fontSize: '13px',
        fontWeight: '800',
        textTransform: 'uppercase',
        padding: '4px 14px',
        borderRadius: '20px',
        letterSpacing: '0.5px',
    },
    tierPrize: {
        fontSize: '28px',
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: '-0.5px',
    },
    tierFee: {
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    tierActiveIndicator: {
        marginTop: '4px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#FFFFFF',
        background: 'rgba(255, 255, 255, 0.15)',
        padding: '4px 12px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
    },
    bannerCard: {
        borderRadius: '20px',
        padding: '24px',
        margin: '10px 0 20px',
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
    },
    bannerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        padding: '4px 12px',
        borderRadius: '8px',
        marginBottom: '6px',
        display: 'inline-block',
    },
    bannerBadge: {
        fontSize: '12px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    bannerTarget: {
        fontSize: '26px',
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: '2px',
        letterSpacing: '-0.5px',
        display: 'flex',
        alignItems: 'center',
    },
    entryBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        padding: '10px 16px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid rgba(255, 255, 255, 0.06)',
    },
    entryLabel: {
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: '600',
    },
    entryPrice: {
        fontSize: '18px',
        fontWeight: '800',
    },
    progressRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '18px',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        flexWrap: 'wrap',
        gap: '8px',
    },
    progressText: {
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
    },
    progressStatus: {
        fontSize: '13px',
        fontWeight: '700',
    },
    fixturesContainer: {
        width: '100%',
        marginTop: '8px',
    },
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '40px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        margin: '8px 0',
        textAlign: 'center',
    },
    emptyTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: '8px',
    },
    emptySubtext: {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.5)',
        lineHeight: '22px',
    },
    matchCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '16px 18px',
        marginBottom: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
    },
    matchHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
    },
    matchIndex: {
        fontSize: '12px',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
    },
    matchKickoff: {
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
    },
    teamsRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
    },
    teamText: {
        flex: 1,
        fontSize: '16px',
        fontWeight: '700',
        color: '#FFFFFF',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    vsBadge: {
        padding: '0 14px',
        fontSize: '11px',
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.2)',
        letterSpacing: '1px',
    },
    picksRow: {
        display: 'flex',
        gap: '8px',
    },
    pickButton: {
        flex: 1,
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        cursor: 'default',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    pickText: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    submitButton: {
        padding: '16px',
        borderRadius: '16px',
        textAlign: 'center',
        marginTop: '12px',
        marginBottom: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: '700',
        letterSpacing: '0.3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoMessage: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '12px',
        padding: '14px 18px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#FBBF24',
        marginTop: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default FootballTab;