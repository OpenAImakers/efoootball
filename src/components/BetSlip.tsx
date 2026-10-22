import React, { useState } from "react";

export interface SlipSelection {
  eventId: number;
  homeTeam: string;
  awayTeam: string;
  selection: "HOME" | "DRAW" | "AWAY";
  odds: number;
}

interface BetSlipProps {
  selections: SlipSelection[];
  onRemove: (eventId: number) => void;
  onClear: () => void;
  onSubmit: (stake: number) => Promise<void>;
  submitting: boolean;
}

const BetSlip: React.FC<BetSlipProps> = ({
  selections,
  onRemove,
  onClear,
  onSubmit,
  submitting,
}) => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [stake, setStake] = useState<number>(100);

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
  const potentialWin = selections.length > 0 ? stake * totalOdds : 0;

  if (selections.length === 0 && !open) {
    return null;
  }

  const handleSubmit = async () => {
    if (stake <= 0) return;
    await onSubmit(stake);
    setCollapsed(true); // Automatically collapse badge after submitting
  };

  const handleExpand = () => {
    setOpen(true);
    setCollapsed(false);
  };

  return (
    <>
      {/* Floating badge when collapsed or closed */}
      {(collapsed || !open) && (
        <button type="button" onClick={handleExpand} style={styles.floatingBtn}>
          <i className="bi bi-receipt" style={{ fontSize: 18 }} />
          <span style={styles.floatingCount}>{selections.length}</span>
          <span style={styles.floatingLabel}>Bet Slip</span>
        </button>
      )}

      {/* Slip panel */}
      {open && !collapsed && (
        <div style={styles.slipPanel} className="bet-slip-panel">
          <div style={styles.slipHeader}>
            <div style={styles.slipHeaderLeft}>
              <i className="bi bi-receipt" style={{ fontSize: 16, color: "#38bdf8" }} />
              <span style={styles.slipTitle}>Bet Slip</span>
              <span style={styles.slipCount}>{selections.length}</span>
            </div>
            <div style={styles.slipHeaderRight}>
              {selections.length > 0 && (
                <button type="button" onClick={onClear} style={styles.clearAll}>
                  Clear
                </button>
              )}

              {/* Collapse button */}
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                style={styles.iconBtn}
                aria-label="Collapse bet slip"
                title="Collapse"
              >
                <i className="bi bi-chevron-down" style={{ fontSize: 12 }} />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCollapsed(false);
                }}
                style={styles.iconBtn}
                aria-label="Close bet slip"
                title="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: 12 }} />
              </button>
            </div>
          </div>

          <div style={styles.slipBody}>
            {selections.length === 0 ? (
              <div style={styles.emptySlip}>Pick matches to add them to your slip.</div>
            ) : (
              selections.map((s) => (
                <div key={s.eventId} style={styles.selectionRow}>
                  <div style={styles.selectionInfo}>
                    <span style={styles.selectionTeams}>
                      {s.homeTeam} vs {s.awayTeam}
                    </span>
                    <span style={styles.selectionPick}>
                      {s.selection === "HOME" ? "1" : s.selection === "DRAW" ? "X" : "2"} ·{" "}
                      {s.odds.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(s.eventId)}
                    style={styles.removeBtn}
                    aria-label="Remove"
                  >
                    <i className="bi bi-x" style={{ fontSize: 14 }} />
                  </button>
                </div>
              ))
            )}
          </div>

          {selections.length > 0 && (
            <div style={styles.slipFooter}>
              <div style={styles.stakeRow}>
                <label style={styles.stakeLabel}>Stake (KSh)</label>
                <input
                  type="number"
                  min={1}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  style={styles.stakeInput}
                />
              </div>
              <div style={styles.summaryRow}>
                <span>Total Odds</span>
                <span style={styles.summaryVal}>{totalOdds.toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Potential Win</span>
                <span style={styles.potentialWin}>KSh {potentialWin.toFixed(0)}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || stake <= 0}
                style={{
                  ...styles.submitBtn,
                  opacity: submitting || stake <= 0 ? 0.6 : 1,
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                {submitting ? "Placing..." : `Place Bet · KSh ${stake}`}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .bet-slip-panel {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            border-radius: 16px 16px 0 0 !important;
            max-height: 80vh;
          }
        }
      `}</style>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  floatingBtn: {
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 1500,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 18px",
    background: "linear-gradient(135deg, #0EA5E9, #0284c7)",
    color: "#fff",
    border: "none",
    borderRadius: 30,
    boxShadow: "0 8px 24px rgba(14,165,233,0.4)",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },
  floatingCount: {
    background: "#fff",
    color: "#0284c7",
    borderRadius: 10,
    padding: "1px 7px",
    fontSize: 11,
    fontWeight: 900,
  },
  floatingLabel: { fontSize: 13 },
  slipPanel: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 360,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    background: "rgba(15, 23, 42, 0.98)",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    borderRadius: 16,
    zIndex: 1500,
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    backdropFilter: "blur(16px)",
    overflow: "hidden",
  },
  slipHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(56,189,248,0.06)",
  },
  slipHeaderLeft: { display: "flex", alignItems: "center", gap: 8 },
  slipHeaderRight: { display: "flex", alignItems: "center", gap: 8 },
  slipTitle: { fontSize: 14, fontWeight: 800, color: "#fff" },
  slipCount: {
    background: "#38bdf8",
    color: "#0f172a",
    fontSize: 10,
    fontWeight: 900,
    padding: "2px 7px",
    borderRadius: 8,
  },
  clearAll: {
    background: "transparent",
    border: "none",
    color: "#f87171",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    padding: "2px 6px",
  },
  iconBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#94a3b8",
    width: 24,
    height: 24,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  slipBody: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  emptySlip: {
    textAlign: "center",
    padding: "20px 12px",
    fontSize: 12,
    color: "#64748b",
  },
  selectionRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: "8px 10px",
  },
  selectionInfo: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  selectionTeams: {
    fontSize: 12,
    fontWeight: 700,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  selectionPick: { fontSize: 11, color: "#38bdf8", fontWeight: 700 },
  removeBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "none",
    color: "#f87171",
    width: 24,
    height: 24,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  slipFooter: {
    padding: "12px 14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  stakeRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  stakeLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8" },
  stakeInput: {
    width: 100,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#fff",
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "right",
    outline: "none",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#94a3b8",
  },
  summaryVal: { fontWeight: 800, color: "#fff" },
  potentialWin: { fontWeight: 900, color: "#22c55e" },
  submitBtn: {
    marginTop: 4,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default BetSlip;