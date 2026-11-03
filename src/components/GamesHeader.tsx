import React, { useRef, useState } from "react";

export type StatusFilter = "ALL" | "UPCOMING" | "LIVE" | "FINISHED";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local (device) date as YYYY-MM-DD. Do NOT use toISOString() for this, it's UTC. */
export const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (ymd: string, n: number) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return toLocalYMD(new Date(y, m - 1, d + n));
};

const parseYMD = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const shortDayLabel = (ymd: string) =>
  parseYMD(ymd).toLocaleDateString([], { weekday: "short", day: "numeric" });

const customDayLabel = (ymd: string) =>
  parseYMD(ymd).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

interface StickyHeaderProps {
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResultCount: number | null; // null = no search active
  selectedDay: string; // YYYY-MM-DD (local)
  onDayChange: (value: string) => void;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  searchResultCount,
  selectedDay,
  onDayChange,
}) => {
  const [focused, setFocused] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const today = toLocalYMD(new Date());
  const dayPills = [
    { value: today, label: "Today" },
    { value: addDays(today, 1), label: "Tomorrow" },
    ...[2, 3, 4, 5, 6].map((n) => {
      const v = addDays(today, n);
      return { value: v, label: shortDayLabel(v) };
    }),
  ];
  const customActive = !dayPills.some((p) => p.value === selectedDay);

  const openPicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      if (typeof (el as any).showPicker === "function") {
        (el as any).showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div style={styles.topBar}>
      <style>{`.gh-scroll::-webkit-scrollbar { display: none; }`}</style>

      <div style={styles.titleWrap}>
        <h1 style={styles.title}>
          <span style={styles.titleMain}>Football</span>
        </h1>
        <p style={styles.subtitle}>Pick a day. Find your odds. Take the win.</p>
      </div>

      <div style={styles.searchWrap}>
        <div
          style={{
            ...styles.searchBox,
            borderColor: focused ? "#38bdf8" : "rgba(255,255,255,0.08)",
            boxShadow: focused ? "0 0 0 3px rgba(56,189,248,0.15)" : "none",
          }}
        >
          <i className="bi bi-search" style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search team or fixture..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              style={styles.clearBtn}
              aria-label="Clear search"
            >
              <i className="bi bi-x-lg" style={{ fontSize: 11 }} />
            </button>
          )}
        </div>

        {searchQuery && searchResultCount !== null && (
          <div style={styles.searchHint}>
            {searchResultCount === 0
              ? "No match like that on this day."
              : `${searchResultCount} match${searchResultCount === 1 ? "" : "es"} found`}
          </div>
        )}
      </div>

      {/* Day selector */}
      <div style={styles.dayScroll} className="gh-scroll">
        <div style={styles.dayRow}>
          {dayPills.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onDayChange(p.value)}
              style={{
                ...styles.pill,
                ...(selectedDay === p.value ? styles.pillActive : {}),
              }}
            >
              {p.label}
            </button>
          ))}

          <span style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={openPicker}
              style={{
                ...styles.pill,
                ...(customActive ? styles.pillActive : {}),
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="bi bi-calendar3" style={{ fontSize: 11 }} />
              {customActive ? customDayLabel(selectedDay) : "Pick date"}
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDay}
              onChange={(e) => {
                if (e.target.value) onDayChange(e.target.value);
              }}
              tabIndex={-1}
              aria-hidden="true"
              style={styles.hiddenDateInput}
            />
          </span>
        </div>
      </div>

      {/* Status filter */}
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
    zIndex: 10,
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
  titleWrap: { textAlign: "center", maxWidth: "100%" },
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
  subtitle: {
    margin: "0.35rem 0 0",
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 400,
  },
  searchWrap: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid",
    borderRadius: 10,
    padding: "8px 12px",
    gap: 8,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
  searchIcon: { fontSize: 14, color: "#64748b" },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
  },
  clearBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#94a3b8",
    borderRadius: 6,
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  searchHint: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500,
  },
  dayScroll: {
    width: "100%",
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  dayRow: {
    display: "flex",
    gap: 6,
    width: "max-content",
    margin: "0 auto",
    padding: "0 2px",
  },
  hiddenDateInput: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
    colorScheme: "dark",
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
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  pillActive: {
    background: "#38bdf8",
    color: "#0f172a",
    border: "1px solid #38bdf8",
  },
};

export default StickyHeader;