import React, { useState } from 'react';
import Navbar from '../../components/ExternalHeader';
import {
  useSurvivorTab,
  POPUP_COLORS,
  formatKes,
  formatKickoff,
  SURVIVOR_ACCENT,
  SURVIVOR_ALIVE,
  SURVIVOR_OUT,
  type SurvivorMatch,
  type SurvivorPool,
} from './useSurvivorTab';

const SurvivorPage: React.FC = () => {
  const {
    loading,
    userId,
    pools,
    selectedPoolId,
    rounds,
    players,
    usernames,
    joining,
    submittingMatch,
    popup,
    selectedPool,
    myEntries,
    activeEntry,
    currentRound,
    currentMatches,
    currentPicksByEntry,
    usedTeamsByEntry,
    potTotal,
    prizePot,
    aliveCount,
    roundHistory,
    setActiveEntryId,
    openPool,
    dismissPopup,
    handleJoin,
    handlePick,
  } = useSurvivorTab();

  const [showRules, setShowRules] = useState(false);

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const popupColor = POPUP_COLORS[popup.variant];

  const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Coming soon', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
    open: { label: 'OPEN', color: SURVIVOR_ALIVE, bg: 'rgba(74,222,128,0.15)' },
    closed: { label: 'RUNNING', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    settled: { label: 'COMPLETED', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  };

  const picksLocked =
    !currentRound ||
    currentRound.status !== 'open' ||
    new Date(currentRound.closes_at).getTime() < Date.now();

  const canPick =
    !!activeEntry && activeEntry.alive && !picksLocked;

  // -------------------------------------------------- LOBBY (pool list) view
  const renderLobby = () => (
    <div>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Live Pools</h3>
      </div>

      {pools.length === 0 && (
        <div style={styles.emptyCard}>
          <div style={styles.emptyTitle}>No pools yet</div>
          <div style={styles.emptySubtext}>
            The first Survivor pool is being set up. Check back shortly.
          </div>
        </div>
      )}

      <div style={styles.poolGrid}>
        {pools.map((pool: SurvivorPool) => {
          const meta = STATUS_META[pool.status] ?? STATUS_META.draft;
          return (
            <div key={pool.id} style={styles.poolCard}>
              <div style={styles.poolCardTop}>
                <span style={styles.poolName}>{pool.name}</span>
                <span
                  style={{
                    ...styles.statusChip,
                    color: meta.color,
                    backgroundColor: meta.bg,
                  }}
                >
                  {meta.label}
                </span>
              </div>
              <div style={styles.poolCardStats}>
                <span style={styles.poolStat}>
                  <i className="bi bi-ticket-perforated-fill" style={{ marginRight: 6, color: SURVIVOR_ACCENT }} />
                  Entry {formatKes(pool.entry_fee)}
                </span>
                <span style={styles.poolStat}>
                  <i className="bi bi-people-fill" style={{ marginRight: 6, color: SURVIVOR_ACCENT }} />
                  Up to {pool.max_entries_per_user} ent{pool.max_entries_per_user > 1 ? 'ries' : 'ry'}/player
                </span>
              </div>
              {pool.closes_at && pool.status === 'open' && (
                <div style={styles.poolDeadline}>
                  <i className="bi bi-alarm" style={{ marginRight: 6 }} />
                  Entries close: {formatKickoff(pool.closes_at)}
                </div>
              )}
              <button
                type="button"
                style={{
                  ...styles.joinButton,
                  opacity: pool.status === 'open' ? 1 : 0.55,
                }}
                disabled={pool.status !== 'open' || joining}
                onClick={() => {
                  if (pool.status === 'open') {
                    handleJoin(pool);
                  } else {
                    openPool(pool.id);
                  }
                }}
              >
                {joining ? (
                  <span style={styles.btnSpinner} />
                ) : pool.status === 'open' ? (
                  <>
                    <i className="bi bi-lightning-charge-fill" style={{ marginRight: 8 }} />
                    Join for {formatKes(pool.entry_fee)}
                  </>
                ) : (
                  'View pool'
                )}
              </button>
              <button type="button" style={styles.viewLink} onClick={() => openPool(pool.id)}>
                View standings & fixtures →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // -------------------------------------------------- Pool detail view
  const renderDetail = () => {
    if (!selectedPool) {
      return (
        <div style={styles.emptyCard}>
          <div style={styles.emptyTitle}>Pool not found</div>
          <button type="button" style={styles.backButton} onClick={() => openPool(null)}>
            ← Back to all pools
          </button>
        </div>
      );
    }

    const myPick = activeEntry ? currentPicksByEntry[activeEntry.id] : undefined;
    const usedTeams = activeEntry ? usedTeamsByEntry[activeEntry.id] ?? new Set<string>() : new Set<string>();

    return (
      <div>
        <button type="button" style={styles.backButton} onClick={() => openPool(null)}>
          ← All pools
        </button>

        {/* Pool header */}
        <div style={styles.poolHeader}>
          <div style={styles.poolHeaderTop}>
            <h2 style={styles.poolTitle}>{selectedPool.name}</h2>
            <span
              style={{
                ...styles.statusChip,
                color: (STATUS_META[selectedPool.status] ?? STATUS_META.draft).color,
                backgroundColor: (STATUS_META[selectedPool.status] ?? STATUS_META.draft).bg,
              }}
            >
              {(STATUS_META[selectedPool.status] ?? STATUS_META.draft).label}
            </span>
          </div>
          <div style={styles.statRow}>
            <div style={styles.statBox}>
              <span style={styles.statValue}>{formatKes(prizePot)}</span>
              <span style={styles.statLabel}>Winner pot</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>{aliveCount}</span>
              <span style={styles.statLabel}>Still standing</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>{formatKes(potTotal)}</span>
              <span style={styles.statLabel}>Collected</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>{rounds.length || '—'}</span>
              <span style={styles.statLabel}>Rounds</span>
            </div>
          </div>
          {selectedPool.status === 'open' && (
            <button
              type="button"
              style={styles.joinButton}
              disabled={joining || myEntries.length >= selectedPool.max_entries_per_user}
              onClick={() => handleJoin(selectedPool)}
            >
              {joining ? (
                <span style={styles.btnSpinner} />
              ) : myEntries.length >= selectedPool.max_entries_per_user ? (
                'Max entries reached'
              ) : (
                <>
                  <i className="bi bi-lightning-charge-fill" style={{ marginRight: 8 }} />
                  {myEntries.length > 0
                    ? `Add entry #${myEntries.length + 1} — ${formatKes(selectedPool.entry_fee)}`
                    : `Join for ${formatKes(selectedPool.entry_fee)}`}
                </>
              )}
            </button>
          )}
        </div>

        {/* My entries strip */}
        {myEntries.length > 0 && (
          <div style={styles.entryStrip}>
            <span style={styles.entryStripLabel}>My entries:</span>
            {myEntries.map((entry) => {
              const isActive = activeEntry?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveEntryId(entry.id)}
                  style={{
                    ...styles.entryChip,
                    ...(isActive && { borderColor: SURVIVOR_ACCENT, color: SURVIVOR_ACCENT }),
                  }}
                >
                  Entry {entry.entry_number}{' '}
                  {entry.alive ? (
                    <i className="bi bi-heart-pulse-fill" style={{ color: SURVIVOR_ALIVE }} />
                  ) : (
                    <span style={{ color: SURVIVOR_OUT }}>OUT R{entry.eliminated_round}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Current round */}
        {currentRound && (
          <div style={styles.roundCard}>
            <div style={styles.roundHeader}>
              <div>
                <span style={styles.roundTitle}>Round {currentRound.round_number}</span>
                <span style={styles.roundMeta}>
                  {' '}· picks close {formatKickoff(currentRound.closes_at)}
                </span>
              </div>
              <span
                style={{
                  ...styles.statusChip,
                  color: picksLocked ? '#f87171' : SURVIVOR_ALIVE,
                  backgroundColor: picksLocked ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)',
                }}
              >
                {picksLocked ? 'PICKS LOCKED' : 'PICKS OPEN'}
              </span>
            </div>

            {activeEntry && activeEntry.alive && !picksLocked && !myPick && (
              <div style={styles.pickReminder}>
                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 8, color: '#fbbf24' }} />
                No pick yet for Entry {activeEntry.entry_number} — one loss and you're out!
              </div>
            )}

            {currentMatches.length === 0 ? (
              <div style={styles.emptyCard}>
                <div style={styles.emptyTitle}>Fixtures coming soon</div>
                <div style={styles.emptySubtext}>
                  The fixtures for this round will appear here.
                </div>
              </div>
            ) : (
              <div style={styles.matchList}>
                {currentMatches.map((match: SurvivorMatch) => {
                  const isDone = match.status !== 'pending';
                  const entryPick = activeEntry
                    ? currentPicksByEntry[activeEntry.id]
                    : undefined;
                  const pickedThisMatch = entryPick && entryPick.match_id === match.id;
                  const homeUsed = usedTeams.has(match.home_team);
                  const awayUsed = usedTeams.has(match.away_team);
                  const busy = submittingMatch === match.id;
                  return (
                    <div key={match.id} style={styles.matchRow}>
                      <div style={styles.matchTeamsRow}>
                        <span style={styles.matchTeams}>
                          <b>{match.home_team}</b>
                          <span style={styles.vs}> vs </span>
                          <b>{match.away_team}</b>
                        </span>
                        <span style={styles.matchTime}>{formatKickoff(match.match_time)}</span>
                      </div>

                      {isDone ? (
                        <div style={styles.matchResultRow}>
                          {match.status === 'void' ? (
                            <span style={{ color: '#94a3b8' }}>Match voided — picks refunded as PUSH</span>
                          ) : (
                            <span>
                              Result: <b>{match.home_score} - {match.away_score}</b>{' '}
                              <span style={{ color: SURVIVOR_ACCENT }}>({match.outcome})</span>
                            </span>
                          )}
                          {pickedThisMatch && entryPick.result && (
                            <span
                              style={{
                                ...styles.resultChip,
                                color:
                                  entryPick.result === 'WON'
                                    ? SURVIVOR_ALIVE
                                    : entryPick.result === 'LOST'
                                    ? SURVIVOR_OUT
                                    : '#94a3b8',
                              }}
                            >
                              {entryPick.result === 'WON'
                                ? '✔ YOU SURVIVED'
                                : entryPick.result === 'LOST'
                                ? '✖ ELIMINATED'
                                : 'PUSH (safe)'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={styles.pickRow}>
                          {(['HOME', 'AWAY'] as const).map((side) => {
                            const teamName = side === 'HOME' ? match.home_team : match.away_team;
                            const teamUsed = side === 'HOME' ? homeUsed : awayUsed;
                            const isSelected =
                              pickedThisMatch && entryPick.selection === side;
                            const disabled =
                              !canPick || teamUsed || isDone || busy;
                            return (
                              <button
                                key={side}
                                type="button"
                                disabled={disabled}
                                onClick={() => handlePick(match, side)}
                                style={{
                                  ...styles.pickButton,
                                  ...(isSelected && {
                                    backgroundColor: SURVIVOR_ACCENT,
                                    borderColor: SURVIVOR_ACCENT,
                                    color: '#04121f',
                                  }),
                                  ...(teamUsed && { opacity: 0.4 }),
                                }}
                              >
                                <span style={styles.pickSide}>{side === 'HOME' ? 'HOME' : 'AWAY'}</span>
                                <span style={styles.pickTeam}>
                                  {teamName}
                                  {teamUsed && ' · used'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {busyAnywhere && (
              <div style={styles.savingNote}>
                <span style={styles.btnSpinnerSmall} /> Saving your pick…
              </div>
            )}
          </div>
        )}

        {/* History */}
        {roundHistory.filter((h) => h.myResults.some((r) => r.pick || r.match)).length > 0 && (
          <div style={styles.historyCard}>
            <h4 style={styles.sectionTitleSmall}>My results by round</h4>
            {roundHistory
              .filter((h) => h.myResults.some((r) => r.pick || r.match))
              .map((h) => (
                <div key={h.round.id} style={styles.historyRow}>
                  <span style={styles.historyRound}>R{h.round.round_number}</span>
                  {h.myResults.map((res) => (
                    <span key={res.entry.id} style={styles.historyItem}>
                      E{res.entry.entry_number}:{' '}
                      {res.pick ? (
                        <>
                          {res.pick.team_name}{' '}
                          <b
                            style={{
                              color:
                                res.pick.result === 'WON'
                                  ? SURVIVOR_ALIVE
                                  : res.pick.result === 'LOST'
                                  ? SURVIVOR_OUT
                                  : '#94a3b8',
                            }}
                          >
                            {res.pick.result ?? ''}
                          </b>
                        </>
                      ) : (
                        <span style={{ color: '#64748b' }}>no pick</span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
          </div>
        )}

        {/* Standings */}
        <div style={styles.standingsCard}>
          <h4 style={styles.sectionTitleSmall}>
            <i className="bi bi-heart-pulse-fill" style={{ color: SURVIVOR_ALIVE, marginRight: 8 }} />
            {aliveCount} still standing · {players.length - aliveCount} eliminated
          </h4>
          <div style={styles.standingsChips}>
            {players
              .filter((p) => p.alive)
              .slice(0, 40)
              .map((p) => (
                <span key={p.id} style={styles.aliveChip}>
                  @{usernames[p.user_id] ?? 'player'} · E{p.entry_number}
                </span>
              ))}
            {aliveCount > 40 && <span style={styles.moreNote}>+{aliveCount - 40} more…</span>}
          </div>
        </div>
      </div>
    );
  };

  const busyAnywhere = submittingMatch !== null;

  return (
    <>
      <Navbar />

      <div style={styles.pageWrapper}>
        {/* Hero */}
        <div style={styles.heroSection}>
          <div style={styles.heroTitleRow}>
            <h1 style={styles.heroTitle}>
              <i className="bi bi-lightning-charge-fill" style={{ color: SURVIVOR_ACCENT, marginRight: 10 }} />
              Survivor
            </h1>
            <button type="button" style={styles.rulesToggle} onClick={() => setShowRules((v) => !v)}>
              <i className="bi bi-question-circle" style={{ marginRight: 6 }} />
              How to play
            </button>
          </div>
          <p style={styles.heroSubtitle}>
            One pick a week. Lose once — you're out. Last one standing takes the pot.
          </p>

          {showRules && (
            <div style={styles.rulesCard}>
              <div style={styles.ruleItem}>
                <b>1.</b> Pay the entry fee once to join a pool.
              </div>
              <div style={styles.ruleItem}>
                <b>2.</b> Each round, pick <b>ONE team to WIN</b> its match. A draw counts as a loss.
              </div>
              <div style={styles.ruleItem}>
                <b>3.</b> Win → you survive. Lose (or forget to pick) → eliminated.
              </div>
              <div style={styles.ruleItem}>
                <b>4.</b> You can never pick the same team twice in one pool — save the big clubs wisely.
              </div>
              <div style={styles.ruleItem}>
                <b>5.</b> If every remaining player loses in the same round, everyone survives and the pool rolls on. Ties at the end split the pot.
              </div>
            </div>
          )}
        </div>

        {selectedPoolId ? renderDetail() : renderLobby()}
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
      `}</style>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#070c18',
    color: '#e2e8f0',
    paddingTop: 88,
    paddingBottom: 64,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070c18',
  },
  spinner: {
    width: 42,
    height: 42,
    border: '4px solid rgba(56,189,248,0.25)',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  btnSpinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  btnSpinnerSmall: {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid rgba(56,189,248,0.4)',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: 8,
  },
  heroSection: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '0 16px 8px',
  },
  heroTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroTitle: {
    fontSize: '2rem',
    fontWeight: 900,
    margin: 0,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    margin: '6px 0 0',
  },
  rulesToggle: {
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.35)',
    color: '#38bdf8',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rulesCard: {
    marginTop: 12,
    background: 'rgba(56,189,248,0.06)',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: 14,
    padding: '14px 16px',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: '#cbd5e1',
  },
  ruleItem: {
    marginBottom: 4,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 860,
    margin: '18px auto 0',
    padding: '0 16px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 800,
    margin: 0,
  },
  sectionTitleSmall: {
    fontSize: '0.95rem',
    fontWeight: 800,
    margin: '0 0 10px',
  },
  poolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: 14,
    maxWidth: 860,
    margin: '14px auto 0',
    padding: '0 16px',
  },
  poolCard: {
    background: 'linear-gradient(160deg, rgba(30,41,59,0.65), rgba(15,23,42,0.85))',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  poolCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  poolName: {
    fontWeight: 800,
    fontSize: '1rem',
  },
  statusChip: {
    fontSize: '0.68rem',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: 999,
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  poolCardStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: '0.83rem',
    color: '#cbd5e1',
  },
  poolStat: {},
  poolDeadline: {
    fontSize: '0.78rem',
    color: '#fbbf24',
  },
  joinButton: {
    marginTop: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '11px 16px',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    color: '#04121f',
    fontWeight: 800,
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
  },
  viewLink: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.78rem',
    cursor: 'pointer',
    textAlign: 'center',
    padding: 0,
  },
  backButton: {
    display: 'block',
    maxWidth: 860,
    margin: '0 auto 10px',
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 16px',
    textAlign: 'left',
    width: '100%',
  },
  emptyCard: {
    maxWidth: 860,
    margin: '16px auto 0',
    padding: '28px 16px',
    textAlign: 'center',
    background: 'rgba(148,163,184,0.06)',
    border: '1px dashed rgba(148,163,184,0.3)',
    borderRadius: 14,
    marginLeft: 16,
    marginRight: 16,
  },
  emptyTitle: {
    fontWeight: 800,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: '0.83rem',
    color: '#94a3b8',
  },
  poolHeader: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '14px 16px',
    background: 'linear-gradient(160deg, rgba(30,41,59,0.65), rgba(15,23,42,0.9))',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: 16,
  },
  poolHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  poolTitle: {
    fontSize: '1.25rem',
    fontWeight: 900,
    margin: 0,
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    margin: '14px 0',
  },
  statBox: {
    background: 'rgba(2,6,23,0.6)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: 12,
    padding: '10px 8px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontWeight: 900,
    fontSize: '0.98rem',
    color: '#38bdf8',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.68rem',
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryStrip: {
    maxWidth: 860,
    margin: '12px auto 0',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  entryStripLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  entryChip: {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.3)',
    color: '#e2e8f0',
    borderRadius: 999,
    padding: '5px 12px',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  roundCard: {
    maxWidth: 860,
    margin: '14px auto 0',
    padding: 16,
    background: 'rgba(15,23,42,0.75)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 16,
    marginLeft: 16,
    marginRight: 16,
    width: 'calc(100% - 32px)',
  },
  roundHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  roundTitle: {
    fontWeight: 900,
    fontSize: '1.05rem',
    color: '#38bdf8',
  },
  roundMeta: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  pickReminder: {
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.35)',
    color: '#fbbf24',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: '0.82rem',
    marginBottom: 10,
  },
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  matchRow: {
    background: 'rgba(2,6,23,0.55)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  matchTeamsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  matchTeams: {
    fontSize: '0.92rem',
  },
  vs: {
    color: '#64748b',
    fontSize: '0.78rem',
    margin: '0 6px',
  },
  matchTime: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  pickRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  pickButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '10px 8px',
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.35)',
    borderRadius: 10,
    color: '#e2e8f0',
    cursor: 'pointer',
  },
  pickSide: {
    fontSize: '0.62rem',
    fontWeight: 800,
    letterSpacing: 1,
    color: '#64748b',
  },
  pickTeam: {
    fontSize: '0.85rem',
    fontWeight: 800,
  },
  matchResultRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
    fontSize: '0.85rem',
  },
  resultChip: {
    fontWeight: 800,
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: 999,
    background: 'rgba(148,163,184,0.1)',
    whiteSpace: 'nowrap',
  },
  savingNote: {
    marginTop: 10,
    fontSize: '0.8rem',
    color: '#38bdf8',
    display: 'flex',
    alignItems: 'center',
  },
  historyCard: {
    maxWidth: 860,
    margin: '14px auto 0',
    padding: 16,
    background: 'rgba(15,23,42,0.75)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 16,
    marginLeft: 16,
    marginRight: 16,
    width: 'calc(100% - 32px)',
  },
  historyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    padding: '6px 0',
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    fontSize: '0.8rem',
  },
  historyRound: {
    fontWeight: 900,
    color: '#38bdf8',
    minWidth: 32,
  },
  historyItem: {
    color: '#cbd5e1',
  },
  standingsCard: {
    maxWidth: 860,
    margin: '14px auto 0',
    padding: 16,
    background: 'rgba(15,23,42,0.75)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 16,
    marginLeft: 16,
    marginRight: 16,
    width: 'calc(100% - 32px)',
  },
  standingsChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  aliveChip: {
    background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.3)',
    color: '#bbf7d0',
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  moreNote: {
    fontSize: '0.75rem',
    color: '#64748b',
    alignSelf: 'center',
  },
  popupOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 16,
  },
  popupCard: {
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 18,
    padding: '24px 20px',
    maxWidth: 360,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
  },
  popupIconCircle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  popupTitle: {
    fontWeight: 900,
    fontSize: '1.05rem',
    marginBottom: 8,
  },
  popupMessage: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  popupActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  popupButton: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: '0.85rem',
    cursor: 'pointer',
    border: 'none',
  },
  popupButtonPrimary: {
    background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    color: '#04121f',
  },
  popupButtonSecondary: {
    background: 'rgba(148,163,184,0.15)',
    color: '#e2e8f0',
    border: '1px solid rgba(148,163,184,0.3)' as string,
  },
};

export default SurvivorPage;
