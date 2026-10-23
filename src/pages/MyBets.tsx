import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StickyHeader from "../components/ExternalHeader";
import { supabase } from "../supabase";

interface SlipSelection {
  id: string;
  event_id: number;
  selection: "HOME" | "DRAW" | "AWAY";
  odds_at_pick: number | null;
}

interface Slip {
  id: string;
  stake: number;
  potential_win: number | null;
  status: "pending" | "won" | "lost" | "void";
  created_at: string;
  settled_at: string | null;
  slip_selections: SlipSelection[];
}

type Tab = "ALL" | "PENDING" | "WON" | "LOST" | "VOID";

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
  { key: "VOID", label: "Void" },
];

const STATUS_STYLES: Record<
  Slip["status"],
  { bg: string; fg: string; label: string; icon: string }
> = {
  pending: { bg: "rgba(56,189,248,0.15)", fg: "#38bdf8", label: "Pending", icon: "bi-clock-history" },
  won: { bg: "rgba(34,197,94,0.15)", fg: "#4ade80", label: "Won", icon: "bi-trophy-fill" },
  lost: { bg: "rgba(239,68,68,0.15)", fg: "#f87171", label: "Lost", icon: "bi-x-circle-fill" },
  void: { bg: "rgba(148,163,184,0.15)", fg: "#94a3b8", label: "Void", icon: "bi-slash-circle-fill" },
};

const MyBets: React.FC = () => {
  const navigate = useNavigate();

  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchSlips = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("slips")
        .select(
          `
          id,
          stake,
          potential_win,
          status,
          created_at,
          settled_at,
          slip_selections ( id, event_id, selection, odds_at_pick )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setSlips((data ?? []) as Slip[]);
    } catch (err: any) {
      setError(err?.message || "Could not load your bets.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSlips();
  }, [fetchSlips]);

  const filtered = slips.filter((s) => {
    if (tab === "ALL") return true;
    return s.status === tab.toLowerCase();
  });

  const counts = {
    ALL: slips.length,
    PENDING: slips.filter((s) => s.status === "pending").length,
    WON: slips.filter((s) => s.status === "won").length,
    LOST: slips.filter((s) => s.status === "lost").length,
    VOID: slips.filter((s) => s.status === "void").length,
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalOdds = (s: Slip) =>
    s.slip_selections.reduce((acc, sel) => acc * (sel.odds_at_pick ?? 1), 1);

  return (
    <>
   <StickyHeader/>
    <div style={styles.wrapper}>
   

      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>My Bets</h2>
          <button
            type="button"
            onClick={fetchSlips}
            disabled={loading}
            style={styles.refreshBtn}
          >
            <i
              className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}
              style={{ fontSize: 13 }}
            />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabRow} className="mybets-tabs">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                ...styles.tab,
                ...(tab === key ? styles.tabActive : {}),
              }}
            >
              {label}
              <span style={styles.tabCount}>{counts[key]}</span>
            </button>
          ))}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div style={styles.emptyState}>
            <i className="bi bi-receipt" style={{ fontSize: 32, color: "#334155" }} />
            <div style={styles.emptyTitle}>
              {slips.length === 0 ? "You haven't placed any bets yet." : `No ${tab.toLowerCase()} bets.`}
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={styles.emptyCta}
            >
              Browse today's games
            </button>
          </div>
        )}

        {!loading &&
          filtered.map((slip) => {
            const statusStyle = STATUS_STYLES[slip.status];
            const isOpen = expanded.has(slip.id);
            const odds = totalOdds(slip);

            return (
              <div key={slip.id} style={styles.slipCard}>
                <button
                  type="button"
                  onClick={() => toggleExpand(slip.id)}
                  style={styles.slipHeader}
                >
                  <div style={styles.slipHeaderLeft}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.fg,
                      }}
                    >
                      <i className={`bi ${statusStyle.icon}`} style={{ marginRight: 5 }} />
                      {statusStyle.label}
                    </span>
                    <span style={styles.slipDate}>{formatDate(slip.created_at)}</span>
                  </div>
                  <div style={styles.slipHeaderRight}>
                    <span style={styles.slipCount}>
                      {slip.slip_selections.length} pick
                      {slip.slip_selections.length === 1 ? "" : "s"}
                    </span>
                    <i
                      className={`bi bi-chevron-${isOpen ? "up" : "down"}`}
                      style={{ fontSize: 12, color: "#64748b" }}
                    />
                  </div>
                </button>

                <div style={styles.slipSummary}>
                  <div style={styles.summaryCell}>
                    <span style={styles.summaryLabel}>Stake</span>
                    <span style={styles.summaryValue}>KSh {Number(slip.stake).toFixed(0)}</span>
                  </div>
                  <div style={styles.summaryCell}>
                    <span style={styles.summaryLabel}>Total Odds</span>
                    <span style={styles.summaryValue}>{odds.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryCell}>
                    <span style={styles.summaryLabel}>
                      {slip.status === "won" ? "Payout" : "Potential"}
                    </span>
                    <span
                      style={{
                        ...styles.summaryValue,
                        color: slip.status === "won" ? "#4ade80" : "#38bdf8",
                        fontWeight: 900,
                      }}
                    >
                      KSh {Number(slip.potential_win ?? 0).toFixed(0)}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={styles.selectionList}>
                    {slip.slip_selections.map((sel) => (
                      <div key={sel.id} style={styles.selectionRow}>
                        <span style={styles.selectionEvent}>Event #{sel.event_id}</span>
                        <div style={styles.selectionRight}>
                          <span
                            style={{
                              ...styles.pickPill,
                              backgroundColor:
                                sel.selection === "HOME"
                                  ? "rgba(34,197,94,0.15)"
                                  : sel.selection === "DRAW"
                                  ? "rgba(245,158,11,0.15)"
                                  : "rgba(239,68,68,0.15)",
                              color:
                                sel.selection === "HOME"
                                  ? "#4ade80"
                                  : sel.selection === "DRAW"
                                  ? "#fbbf24"
                                  : "#f87171",
                            }}
                          >
                            {sel.selection === "HOME" ? "1" : sel.selection === "DRAW" ? "X" : "2"}
                          </span>
                          <span style={styles.selectionOdds}>
                            {sel.odds_at_pick ? sel.odds_at_pick.toFixed(2) : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {slip.settled_at && (
                      <div style={styles.settledNote}>
                        Settled {formatDate(slip.settled_at)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <style>{`
        @keyframes spinAnim {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spinAnim 1s linear infinite; }

        @media (max-width: 768px) {
          .mybets-tabs {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            scrollbar-width: none;
          }
          .mybets-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    paddingTop: "160px",
    minHeight: "100vh",
    background: "#070c18",
    color: "#f8fafc",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  container: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "16px 16px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: "-0.4px",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  tabRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  tabActive: {
    background: "#38bdf8",
    borderColor: "#38bdf8",
    color: "#0f172a",
  },
  tabCount: {
    fontSize: 10,
    opacity: 0.75,
    fontWeight: 900,
  },
  errorBox: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#f87171",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 20px",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 13,
    color: "#94a3b8",
  },
  emptyCta: {
    marginTop: 6,
    background: "#38bdf8",
    border: "none",
    color: "#0f172a",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  slipCard: {
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    overflow: "hidden",
  },
  slipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
    gap: 10,
  },
  slipHeaderLeft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  slipHeaderRight: { display: "flex", alignItems: "center", gap: 8 },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 800,
    padding: "3px 9px",
    borderRadius: 20,
  },
  slipDate: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  slipCount: { fontSize: 11, color: "#94a3b8", fontWeight: 700 },
  slipSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    padding: "12px 14px",
  },
  summaryCell: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  summaryValue: { fontSize: 14, fontWeight: 800, color: "#e2e8f0" },
  selectionList: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "rgba(0,0,0,0.2)",
  },
  selectionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 6,
  },
  selectionEvent: { fontSize: 12, fontWeight: 600, color: "#cbd5e1" },
  selectionRight: { display: "flex", alignItems: "center", gap: 10 },
  pickPill: {
    fontSize: 11,
    fontWeight: 900,
    width: 24,
    height: 24,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionOdds: {
    fontSize: 12,
    fontWeight: 800,
    color: "#38bdf8",
    minWidth: 40,
    textAlign: "right",
  },
  settledNote: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
    marginTop: 4,
  },
};

export default MyBets;