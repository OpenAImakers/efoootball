import { supabase } from "../../supabase";
import React, { useEffect, useState } from "react";

// Global cache outside component lifecycle to preserve state across remounts
const rankingsCache = {
  data: null as any[] | null,
  timestamp: 0,
};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache expiration

export default function ClanRankingsTable() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRankings = async () => {
      const now = Date.now();
      
      // Serve from cache if data exists and is fresh
      if (rankingsCache.data && (now - rankingsCache.timestamp < CACHE_DURATION)) {
        setClans(rankingsCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clan_rankings")
          .select("*")
          .order("rank", { ascending: true });

        if (error) throw error;
        if (data) {
          // Update global cache
          rankingsCache.data = data;
          rankingsCache.timestamp = now;
          setClans(data);
        }
      } catch (error) {
        console.error("Error loading clan rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const styles = {
    card: {
      background: "transparent",
      border: "none",
      padding: "15px",
      marginBottom: "20px",
      fontFamily:
        "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      color: "#111",
    },

    title: {
      fontSize: "20px",
      fontWeight: 800,
      letterSpacing: "1.2px",
      textTransform: "uppercase" as const,
      marginBottom: "10px",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginTop: "10px",
      fontSize: "14px",
      fontFamily:
        "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
    },

    th: {
      padding: "10px",
      textAlign: "left" as const,
      fontWeight: 800,
      letterSpacing: "1.5px",
      textTransform: "uppercase" as const,
      fontSize: "12px",
    },

    td: {
      padding: "12px 10px",
      fontWeight: 500,
      letterSpacing: "0.5px",
    },

    skeletonBar: {
      height: "14px",
      background: "rgba(0, 0, 0, 0.08)",
      borderRadius: "4px",
      animation: "pulse-row 1.5s infinite ease-in-out",
      display: "inline-block",
    },
  };

  return (
    <div style={styles.card}>
      <style>{`
        @keyframes pulse-row {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
      
      <h2 style={styles.title}>Clan Rankings</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Clan</th>
            <th style={styles.th}>MP</th>
            <th style={styles.th}>W</th>
            <th style={styles.th}>D</th>
            <th style={styles.th}>L</th>
            <th style={styles.th}>Points</th>
            <th style={styles.th}>GD</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            // Render 5 structural row placeholder skeletons mimicking operational table metrics
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-row-${idx}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "25px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "120px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "30px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "25px" }} /></td>
              </tr>
            ))
          ) : clans.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ ...styles.td, textAlign: "center" }}>
                No clans registered yet.
              </td>
            </tr>
          ) : (
            clans.map((c: any, i: number) => (
              <tr key={c.id || i}>
                <td style={{ ...styles.td, fontWeight: 700 }}>
                  #{c.rank}
                </td>
                <td style={{ ...styles.td, fontWeight: 600 }}>
                  {c.name}
                </td>
                <td style={styles.td}>{c.mp}</td>
                <td style={styles.td}>{c.w}</td>
                <td style={styles.td}>{c.d}</td>
                <td style={styles.td}>{c.l}</td>
                <td style={styles.td}>{c.points}</td>
                <td style={styles.td}>
                  {c.gd > 0 ? `+${c.gd}` : c.gd}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}