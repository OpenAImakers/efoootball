import React, { useEffect, useState, useMemo } from "react";
import StickyHeader, { StatusFilter } from "../../components/GamesHeader";

interface League {
  id: number;
  name: string;
  country?: string;
}

interface Odds {
  home_win?: number;
  draw?: number;
  away_win?: number;
  [key: string]: number | undefined;
}

interface Event {
  id: number;
  league_id: number;
  home_team: string;
  away_team: string;
  event_date: string;
  status: string;
  current_minute?: number | null;
  home_score: number | null;
  away_score: number | null;
  round_label?: string;
  stage_name?: string;
  odds?: Odds;
}

const Games: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [leaguesMap, setLeaguesMap] = useState<Record<number, League>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeagueId, setSelectedLeagueId] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      const token = process.env.REACT_APP_BZZOIRO_TOKEN;
      if (!token) {
        setError("API token missing in environment variables.");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      try {
        const [leaguesRes, eventsRes] = await Promise.all([
          fetch(`https://sports.bzzoiro.com/api/v2/leagues/?limit=200`, {
            headers: { Authorization: `Token ${token}` },
            signal: controller.signal,
          }),
          fetch(`https://sports.bzzoiro.com/api/v2/events/?date=${today}`, {
            headers: { Authorization: `Token ${token}` },
            signal: controller.signal,
          }),
        ]);

        if (!eventsRes.ok) throw new Error(`Failed to load matches (${eventsRes.status})`);

        const eventsData = await eventsRes.json();
        const rawEvents: Event[] = eventsData.results ?? [];

        if (leaguesRes.ok) {
          const leaguesData = await leaguesRes.json();
          const map: Record<number, League> = {};
          (leaguesData.results || leaguesData || []).forEach((l: League) => {
            map[l.id] = l;
          });
          setLeaguesMap(map);
        }

        const eventsNeedingOdds = rawEvents.filter(
          (e) => e.status !== "finished" && e.status !== "postponed"
        );

        const CONCURRENCY = 5;
        const oddsMap: Record<number, Odds> = {};

        for (let i = 0; i < eventsNeedingOdds.length; i += CONCURRENCY) {
          const batch = eventsNeedingOdds.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async (evt) => {
              const res = await fetch(
                `https://sports.bzzoiro.com/api/v2/events/${evt.id}/odds/`,
                {
                  headers: { Authorization: `Token ${token}` },
                  signal: controller.signal,
                }
              );
              if (!res.ok) return { id: evt.id, odds: null };
              const data = await res.json();
              return { id: evt.id, odds: data.odds ?? null };
            })
          );

          results.forEach((r) => {
            if (r.status === "fulfilled" && r.value.odds) {
              oddsMap[r.value.id] = r.value.odds;
            }
          });
        }

        const mergedEvents = rawEvents.map((evt) => ({
          ...evt,
          odds: oddsMap[evt.id],
        }));

        setEvents(mergedEvents);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load matches");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const activeLeagues = useMemo(() => {
    const counts = new Map<number, number>();
    events.forEach((evt) => {
      counts.set(evt.league_id, (counts.get(evt.league_id) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([leagueId, count]) => ({
      id: leagueId,
      name: leaguesMap[leagueId]?.name || `League #${leagueId}`,
      country: leaguesMap[leagueId]?.country,
      count,
    }));
  }, [events, leaguesMap]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (selectedLeagueId !== "ALL" && evt.league_id !== selectedLeagueId) return false;
      if (statusFilter === "LIVE" && evt.status !== "inprogress") return false;
      if (statusFilter === "UPCOMING" && evt.status !== "notstarted") return false;
      if (statusFilter === "FINISHED" && evt.status !== "finished") return false;
      return true;
    });
  }, [events, selectedLeagueId, statusFilter]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: number]: Event[] } = {};
    filteredEvents.forEach((evt) => {
      if (!groups[evt.league_id]) groups[evt.league_id] = [];
      groups[evt.league_id].push(evt);
    });
    return groups;
  }, [filteredEvents]);

  return (
    <div style={styles.wrapper}>
      <StickyHeader statusFilter={statusFilter} onStatusChange={setStatusFilter} />

      <div style={styles.container} className="games-container">
        <aside style={styles.sidebar} className="games-sidebar">
          <div style={styles.sidebarHeader} className="games-sidebar-header">
            <span>Categories</span>
            <span style={styles.badge}>{activeLeagues.length} Leagues</span>
          </div>

          <div style={styles.leagueList} className="games-league-list">
            <button
              onClick={() => setSelectedLeagueId("ALL")}
              style={{
                ...styles.leagueItem,
                ...(selectedLeagueId === "ALL" ? styles.leagueItemActive : {}),
              }}
              className="games-league-item"
            >
              <span>All Games</span>
              <span style={styles.leagueCount}>{events.length}</span>
            </button>

            {activeLeagues.map((lg) => (
              <button
                key={lg.id}
                onClick={() => setSelectedLeagueId(lg.id)}
                style={{
                  ...styles.leagueItem,
                  ...(selectedLeagueId === lg.id ? styles.leagueItemActive : {}),
                }}
                className="games-league-item"
              >
                <span style={styles.leagueText}>
                  {lg.name}
                  {lg.country ? ` (${lg.country})` : ""}
                </span>
                <span style={styles.leagueCount}>{lg.count}</span>
              </button>
            ))}
          </div>
        </aside>

        <main style={styles.mainContent}>
          {loading && <div style={styles.stateMessage}>Loading today's matches...</div>}
          {error && !loading && <div style={styles.errorMessage}>{error}</div>}
          {!loading && !error && filteredEvents.length === 0 && (
            <div style={styles.stateMessage}>No matches match the current filter.</div>
          )}

          {!loading &&
            !error &&
            Object.entries(groupedEvents).map(([leagueIdNum, matches]) => {
              const leagueId = Number(leagueIdNum);
              const leagueInfo = leaguesMap[leagueId];

              return (
                <div key={leagueId} style={styles.leagueCard}>
                  <div style={styles.leagueCardHeader}>
                    <span style={styles.leagueTitle}>
                      {leagueInfo?.name || `League #${leagueId}`}
                      {leagueInfo?.country ? ` • ${leagueInfo.country}` : ""}
                    </span>
                    <span style={styles.stageTitle}>
                      {matches[0]?.stage_name || matches[0]?.round_label || ""}
                    </span>
                  </div>

                  <div style={styles.matchList}>
                    {matches.map((evt) => {
                      const isLive = evt.status === "inprogress";
                      const o = evt.odds;

                      return (
                        <div key={evt.id} style={styles.matchRow} className="games-match-row">
                          <div style={styles.timeCol}>
                            {isLive ? (
                              <div style={styles.liveBadge}>
                                <span style={styles.pulseDot} />
                                {evt.current_minute ? `${evt.current_minute}'` : "LIVE"}
                              </div>
                            ) : evt.status === "finished" ? (
                              <span style={styles.statusText}>FT</span>
                            ) : evt.status === "postponed" ? (
                              <span style={styles.postponedText}>POSTP</span>
                            ) : (
                              <span style={styles.timeText}>
                                {new Date(evt.event_date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>

                          <div style={styles.teamsCol}>
                            <div style={styles.teamRow}>
                              <span style={styles.teamName} className="games-team-name">
                                {evt.home_team}
                              </span>
                              <span style={styles.scoreText}>
                                {evt.home_score !== null ? evt.home_score : "-"}
                              </span>
                            </div>
                            <div style={styles.teamRow}>
                              <span style={styles.teamName} className="games-team-name">
                                {evt.away_team}
                              </span>
                              <span style={styles.scoreText}>
                                {evt.away_score !== null ? evt.away_score : "-"}
                              </span>
                            </div>
                          </div>

                          <div style={styles.oddsCol} className="games-odds-col">
                            <div style={styles.oddBtn}>
                              <span style={styles.oddLabel}>1</span>
                              <span style={styles.oddVal} className="games-odd-val">
                                {o?.home_win ? o.home_win.toFixed(2) : "-"}
                              </span>
                            </div>
                            <div style={styles.oddBtn}>
                              <span style={styles.oddLabel}>X</span>
                              <span style={styles.oddVal} className="games-odd-val">
                                {o?.draw ? o.draw.toFixed(2) : "-"}
                              </span>
                            </div>
                            <div style={styles.oddBtn}>
                              <span style={styles.oddLabel}>2</span>
                              <span style={styles.oddVal} className="games-odd-val">
                                {o?.away_win ? o.away_win.toFixed(2) : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .games-container {
            flex-direction: column !important;
            padding: 10px !important;
            gap: 10px !important;
          }
          .games-sidebar {
            width: 100% !important;
            flex: 1 1 100% !important;
            max-height: none !important;
            padding: 8px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .games-sidebar::-webkit-scrollbar { display: none; }
          .games-sidebar-header { display: none !important; }
          .games-league-list {
            flex-direction: row !important;
            margin-top: 0 !important;
            gap: 6px !important;
          }
          .games-league-item {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            width: auto !important;
            padding: 6px 12px !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
          }
          .games-match-row {
            grid-template-columns: 56px 1fr 132px !important;
            padding: 8px 10px !important;
            gap: 8px !important;
          }
          .games-odds-col {
            gap: 4px !important;
          }
        }

        @media (max-width: 400px) {
          .games-match-row {
            grid-template-columns: 44px 1fr 108px !important;
          }
          .games-team-name { font-size: 12px !important; }
          .games-odd-val { font-size: 11px !important; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#070c18",
    color: "#f8fafc",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  container: {
    display: "flex",
    maxWidth: 1280,
    margin: "0 auto",
    padding: 16,
    gap: 16,
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
    height: "fit-content",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  badge: {
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 8,
  },
  leagueList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 6,
  },
  leagueItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    borderRadius: 6,
    color: "#cbd5e1",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  },
  leagueItemActive: {
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    fontWeight: 700,
  },
  leagueText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 170,
  },
  leagueCount: {
    fontSize: 11,
    opacity: 0.6,
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  leagueCard: {
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    overflow: "hidden",
  },
  leagueCardHeader: {
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.03)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leagueTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: "#38bdf8",
  },
  stageTitle: {
    fontSize: 11,
    color: "#64748b",
  },
  matchList: {
    display: "flex",
    flexDirection: "column",
  },
  matchRow: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 180px",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    gap: 12,
  },
  timeCol: {
    fontSize: 12,
  },
  timeText: {
    color: "#e2e8f0",
    fontWeight: 700,
  },
  liveBadge: {
    color: "#22c55e",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
  },
  statusText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: 700,
  },
  postponedText: {
    color: "#f87171",
    fontSize: 10,
    fontWeight: 700,
  },
  teamsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  teamRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 6,
  },
  teamName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd5e1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#38bdf8",
    flexShrink: 0,
  },
  oddsCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 6,
  },
  oddBtn: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 6,
    padding: "4px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  oddLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: 700,
  },
  oddVal: {
    fontSize: 12,
    fontWeight: 700,
    color: "#38bdf8",
  },
  stateMessage: {
    textAlign: "center",
    padding: 32,
    color: "#64748b",
    fontSize: 13,
  },
  errorMessage: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 13,
  },
};

export default Games;