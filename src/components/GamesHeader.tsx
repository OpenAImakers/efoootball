import React from "react";

export type StatusFilter = "ALL" | "UPCOMING" | "LIVE" | "FINISHED";

interface StickyHeaderProps {
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({ statusFilter, onStatusChange }) => {
  return (
    <div style={styles.topBar}>
      <div style={styles.titleWrap}>
        <h1 style={styles.title}>
          <span style={styles.titleMain}>Todays</span>{" "}
          <span style={styles.titleAccent}>Games</span>
        </h1>
        <p style={styles.subtitle}>All your entries and fixtures in one place.</p>
      </div>

      <div style={styles.pillContainer}>
        {(["ALL", "UPCOMING", "LIVE", "FINISHED"] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatusChange(st)}
            style={{
              ...styles.pill,
              ...(statusFilter === st ? styles.pillActive : {}),
            }}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 1200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(3, 10, 26, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  titleWrap: {
    textAlign: "center",
    maxWidth: "100%",
  },
  title: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 900,
    letterSpacing: "-0.6px",
    lineHeight: 1.1,
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
  titleMain: {
    background: "linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  titleAccent: {
    background: "linear-gradient(135deg, #0EA5E9 0%, #10B981 50%, #EC4899 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    margin: "0.35rem 0 0",
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 400,
  },
  pillContainer: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 6,
    padding: "5px 12px",
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.3px",
    cursor: "pointer",
  },
  pillActive: {
    background: "#38bdf8",
    color: "#0f172a",
    border: "1px solid #38bdf8",
  },
};

export default StickyHeader;