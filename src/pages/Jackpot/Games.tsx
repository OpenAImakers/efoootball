import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StickyHeader, { StatusFilter } from "../../components/GamesHeader";
import BetSlip, { SlipSelection } from "../../components/BetSlip";
import { supabase } from "../../supabase";
import { withCache } from "../../Utils/cache";

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
  league_name?: string;
  home_team: string;
  away_team: string;
  event_date: string;
  status: string;
  period?: string | null;
  current_minute?: number | null;
  home_score: number | null;
  away_score: number | null;
  round_label?: string;
  stage_name?: string;
  odds?: Odds;
}

const Games: React.FC = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [leaguesMap, setLeaguesMap] = useState<Record<number, League>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeagueId, setSelectedLeagueId] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selections, setSelections] = useState<Record<number, SlipSelection>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

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
        // 1. Leagues — cached 24h
        const leagues = await withCache<League[]>(
          "games_leagues_v1",
          24 * 60 * 60 * 1000,
          async () => {
            const res = await fetch(
              `https://sports.bzzoiro.com/api/v2/leagues/?limit=200`,
              { headers: { Authorization: `Token ${token}` }, signal: controller.signal }
            );
            if (!res.ok) return [];
            const data = await res.json();
            return data.results ?? [];
          }
        );

        const map: Record<number, League> = {};
        leagues.forEach((l) => {
          map[l.id] = l;
        });
        setLeaguesMap(map);

        // 2. Today's events — cached 2 min
        const rawEvents = await withCache<Event[]>(
          `games_events_${today}`,
          2 * 60 * 1000,
          async () => {
            const res = await fetch(
              `https://sports.bzzoiro.com/api/v2/events/?date=${today}`,
              { headers: { Authorization: `Token ${token}` }, signal: controller.signal }
            );
            if (!res.ok) throw new Error(`Failed to load matches (${res.status})`);
            const data = await res.json();
            return data.results ?? [];
          }
        );

        // 3. Live events — NOT cached long (30s), so LIVE tab stays fresh
        const liveEvents = await withCache<Event[]>(
          `games_live_v1`,
          30 * 1000,
          async () => {
            const res = await fetch(
              `https://sports.bzzoiro.com/api/v2/events/live/`,
              { headers: { Authorization: `Token ${token}` }, signal: controller.signal }
            );
            if (!res.ok) return [];
            const data = await res.json();
            // NOTE: live endpoint uses `events`, not `results`
            return data.events ?? data.results ?? [];
          }
        );

        // Merge: live data overrides date data for matching ids,
        // and appends live-only matches missing from the date response.
        const liveMap = new Map(liveEvents.map((e) => [e.id, e]));
        const merged = rawEvents.map((evt) => {
          const live = liveMap.get(evt.id);
          if (!live) return evt;
          return {
            ...evt,
            status: live.status ?? evt.status,
            home_score: live.home_score ?? evt.home_score,
            away_score: live.away_score ?? evt.away_score,
            current_minute: live.current_minute ?? evt.current_minute,
            period: live.period ?? null,
            league_name: live.league_name ?? evt.league_name,
          };
        });
        const dateIds = new Set(rawEvents.map((e) => e.id));
        const liveOnly = liveEvents.filter((e) => !dateIds.has(e.id));
        const allEvents = [...merged, ...liveOnly];

        // 4. Odds — only for upcoming, NOT live, NOT finished
        const eventsNeedingOdds = allEvents.filter(
          (e) => e.status === "notstarted"
        );

        const CONCURRENCY = 5;
        const oddsMap: Record<number, Odds> = {};

        for (let i = 0; i < eventsNeedingOdds.length; i += CONCURRENCY) {
          const batch = eventsNeedingOdds.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async (evt) => {
              const odds = await withCache<Odds | null>(
                `games_odds_${evt.id}`,
                5 * 60 * 1000,
                async () => {
                  const res = await fetch(
                    `https://sports.bzzoiro.com/api/v2/events/${evt.id}/odds/`,
                    { headers: { Authorization: `Token ${token}` }, signal: controller.signal }
                  );
                  if (!res.ok) return null;
                  const data = await res.json();
                  return data.odds ?? null;
                }
              );
              return { id: evt.id, odds };
            })
          );

          results.forEach((r) => {
            if (r.status === "fulfilled" && r.value.odds) {
              oddsMap[r.value.id] = r.value.odds;
            }
          });
        }

        setEvents(allEvents.map((evt) => ({ ...evt, odds: oddsMap[evt.id] })));
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message || "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const activeLeagues = useMemo(() => {
    const counts = new Map<number, number>();
    events.forEach((evt) => counts.set(evt.league_id, (counts.get(evt.league_id) || 0) + 1));
    return Array.from(counts.entries()).map(([leagueId, count]) => ({
      id: leagueId,
      name:
        leaguesMap[leagueId]?.name ||
        events.find((e) => e.league_id === leagueId)?.league_name ||
        `League #${leagueId}`,
      country: leaguesMap[leagueId]?.country,
      count,
    }));
  }, [events, leaguesMap]);

  // Normalised status helpers — tolerate case & multiple spellings
  const isLiveStatus = (s?: string) => {
    const v = (s || "").toLowerCase();
    return v === "inprogress" || v === "live" || v === "1st_half" || v === "2nd_half";
  };
  const isUpcomingStatus = (s?: string) => {
    const v = (s || "").toLowerCase();
    return v === "notstarted" || v === "scheduled";
  };
  const isFinishedStatus = (s?: string) => {
    const v = (s || "").toLowerCase();
    return v === "finished" || v === "ft";
  };
  const isLocked = (s?: string) => {
    const v = (s || "").toLowerCase();
    return (
      v === "inprogress" ||
      v === "live" ||
      v === "1st_half" ||
      v === "2nd_half" ||
      v === "finished" ||
      v === "ft" ||
      v === "postponed" ||
      v === "cancelled"
    );
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return events.filter((evt) => {
      if (selectedLeagueId !== "ALL" && evt.league_id !== selectedLeagueId) return false;

      if (statusFilter === "LIVE" && !isLiveStatus(evt.status)) return false;
      if (statusFilter === "UPCOMING" && !isUpcomingStatus(evt.status)) return false;
      if (statusFilter === "FINISHED" && !isFinishedStatus(evt.status)) return false;

      if (q) {
        const home = evt.home_team.toLowerCase();
        const away = evt.away_team.toLowerCase();
        if (!home.includes(q) && !away.includes(q)) return false;
      }
      return true;
    });
  }, [events, selectedLeagueId, statusFilter, searchQuery]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: number]: Event[] } = {};
    filteredEvents.forEach((evt) => {
      if (!groups[evt.league_id]) groups[evt.league_id] = [];
      groups[evt.league_id].push(evt);
    });
    return groups;
  }, [filteredEvents]);

  const searchResultCount = searchQuery.trim() === "" ? null : filteredEvents.length;

  const handlePick = useCallback(
    (evt: Event, choice: "HOME" | "DRAW" | "AWAY") => {
      // Hard block: live, finished, postponed, cancelled — no bets
      if (isLocked(evt.status)) return;

      const oddsVal =
        choice === "HOME"
          ? evt.odds?.home_win
          : choice === "DRAW"
          ? evt.odds?.draw
          : evt.odds?.away_win;

      if (!oddsVal) return;

      setSelections((prev) => {
        const next = { ...prev };
        if (next[evt.id]?.selection === choice) {
          delete next[evt.id];
        } else {
          next[evt.id] = {
            eventId: evt.id,
            homeTeam: evt.home_team,
            awayTeam: evt.away_team,
            selection: choice,
            odds: oddsVal,
          };
        }
        return next;
      });
    },
    []
  );

  const handleRemove = useCallback((eventId: number) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  }, []);

  const handleClear = useCallback(() => setSelections({}), []);

  const handleSubmit = useCallback(
    async (stake: number) => {
      const selList = Object.values(selections);
      if (selList.length === 0) return;

      setSubmitting(true);
      setFeedback(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!wallet || Number(wallet.balance) < stake) {
          setFeedback({
            type: "error",
            msg: "Insufficient balance. Top up your wallet to place this bet.",
          });
          navigate("/deposit");
          return;
        }

        const totalOdds = selList.reduce((acc, s) => acc * s.odds, 1);
        const potentialWin = Math.floor(stake * totalOdds * 100) / 100;

        const picks = selList.map((s) => ({
          event_id: s.eventId,
          selection: s.selection,
          odds_at_pick: s.odds,
        }));

        const { data: slipId, error: rpcError } = await supabase.rpc("place_slip", {
          p_stake: stake,
          p_potential_win: potentialWin,
          p_picks: picks,
        });

        if (rpcError) throw rpcError;
        if (!slipId) throw new Error("Slip was not created");

        setSelections({});
        setFeedback({
          type: "success",
          msg: `Bet placed! ${selList.length} selection${selList.length === 1 ? "" : "s"} · KSh ${stake}`,
        });
      } catch (err: any) {
        const msg = err?.message ?? "";

        if (msg.includes("INSUFFICIENT_BALANCE")) {
          setFeedback({
            type: "error",
            msg: "Insufficient balance. Redirecting to deposit...",
          });
          navigate("/deposit");
        } else if (msg.includes("WALLET_NOT_FOUND")) {
          setFeedback({
            type: "error",
            msg: "Wallet not found. Please sign out and back in, or contact support.",
          });
        } else if (msg.includes("NOT_AUTHENTICATED")) {
          navigate("/auth");
        } else {
          setFeedback({
            type: "error",
            msg: msg || "Could not place bet. Try again.",
          });
        }
      } finally {
        setSubmitting(false);
      }
    },
    [selections, navigate]
  );

  return (
    <div style={styles.wrapper}>
      <StickyHeader
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResultCount={searchResultCount}
      />

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
          {feedback && (
            <div
              style={{
                ...styles.feedbackBox,
                ...(feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError),
              }}
            >
              {feedback.msg}
            </div>
          )}

          {loading && <div style={styles.stateMessage}>Loading today's matches...</div>}
          {error && !loading && <div style={styles.errorMessage}>{error}</div>}
          {!loading && !error && filteredEvents.length === 0 && (
            <div style={styles.stateMessage}>
              {searchQuery.trim()
                ? "No matches for that search today."
                : "No matches match the current filter."}
            </div>
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
                      {leagueInfo?.name ||
                        matches[0]?.league_name ||
                        `League #${leagueId}`}
                      {leagueInfo?.country ? ` • ${leagueInfo.country}` : ""}
                    </span>
                    <span style={styles.stageTitle}>
                      {matches[0]?.stage_name || matches[0]?.round_label || ""}
                    </span>
                  </div>

                  <div style={styles.matchList}>
                    {matches.map((evt) => {
                      const isLive = isLiveStatus(evt.status);
                      const o = evt.odds;
                      const pick = selections[evt.id]?.selection;
                      const locked = isLocked(evt.status);

                      return (
                        <div key={evt.id} style={styles.matchRow} className="games-match-row">
                          <div style={styles.timeCol}>
                            {isLive ? (
                              <div style={styles.liveBadge}>
                                <span style={styles.pulseDot} />
                                {evt.current_minute ? `${evt.current_minute}'` : "LIVE"}
                              </div>
                            ) : isFinishedStatus(evt.status) ? (
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
                            {(
                              [
                                { key: "HOME", label: "1", val: o?.home_win },
                                { key: "DRAW", label: "X", val: o?.draw },
                                { key: "AWAY", label: "2", val: o?.away_win },
                              ] as const
                            ).map(({ key, label, val }) => {
                              const active = pick === key;
                              const disabled = !val || locked;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => handlePick(evt, key)}
                                  title={
                                    locked
                                      ? isLive
                                        ? "Live match — no betting"
                                        : "Match unavailable"
                                      : undefined
                                  }
                                  style={{
                                    ...styles.oddBtn,
                                    ...(active ? styles.oddBtnActive : {}),
                                    opacity: disabled ? 0.4 : 1,
                                    cursor: disabled ? "not-allowed" : "pointer",
                                  }}
                                >
                                  <span
                                    style={{
                                      ...styles.oddLabel,
                                      ...(active ? styles.oddLabelActive : {}),
                                    }}
                                  >
                                    {label}
                                  </span>
                                  <span
                                    style={{
                                      ...styles.oddVal,
                                      ...(active ? styles.oddValActive : {}),
                                    }}
                                    className="games-odd-val"
                                  >
                                    {val ? val.toFixed(2) : "-"}
                                  </span>
                                </button>
                              );
                            })}
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

      <BetSlip
        selections={Object.values(selections)}
        onRemove={handleRemove}
        onClear={handleClear}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

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
          .games-odds-col { gap: 4px !important; }
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
  leagueList: { display: "flex", flexDirection: "column", gap: 4, marginTop: 6 },
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
  leagueCount: { fontSize: 11, opacity: 0.6, marginLeft: 8 },
  mainContent: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 },
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
  leagueTitle: { fontWeight: 700, fontSize: 14, color: "#38bdf8" },
  stageTitle: { fontSize: 11, color: "#64748b" },
  matchList: { display: "flex", flexDirection: "column" },
  matchRow: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 180px",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    gap: 12,
  },
  timeCol: { fontSize: 12 },
  timeText: { color: "#e2e8f0", fontWeight: 700 },
  liveBadge: {
    color: "#22c55e",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  pulseDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e" },
  statusText: { color: "#64748b", fontSize: 11, fontWeight: 700 },
  postponedText: { color: "#f87171", fontSize: 10, fontWeight: 700 },
  teamsCol: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  teamRow: { display: "flex", justifyContent: "space-between", gap: 6 },
  teamName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd5e1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  scoreText: { fontSize: 13, fontWeight: 800, color: "#38bdf8", flexShrink: 0 },
  oddsCol: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 },
  oddBtn: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 6,
    padding: "4px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  oddBtnActive: {
    background: "#38bdf8",
    borderColor: "#38bdf8",
  },
  oddLabel: { fontSize: 9, color: "#64748b", fontWeight: 700 },
  oddLabelActive: { color: "rgba(15,23,42,0.75)" },
  oddVal: { fontSize: 12, fontWeight: 700, color: "#38bdf8" },
  oddValActive: { color: "#0f172a" },
  stateMessage: { textAlign: "center", padding: 32, color: "#64748b", fontSize: 13 },
  errorMessage: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 13,
  },
  feedbackBox: { padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600 },
  feedbackSuccess: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#4ade80",
    border: "1px solid rgba(34, 197, 94, 0.3)",
  },
  feedbackError: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#f87171",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
};

export default Games;