import { supabase } from "../../supabase";
import React, { useEffect, useState } from "react";

// Global cache object to hold state outside of lifecycle mounts
const leaderboardCache = {
  data: null as any[] | null,
  timestamp: 0,
};
const CACHE_EXPIRY = 1000 * 60 * 3; // 3 minutes cache lifespan

const LOADING_PHRASES = [
  "CONNECTING TO LEAGUE SERVERS...",
  "SYNCING PLAYER STATS...",
  "CALIBRATING MMR RANKINGS...",
  "COMPILING TOURNAMENT LEADERBOARD...",
];

export default function AllPlayersTable() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [phraseIdx, setPhraseIdx] = useState<number>(0);

  // Cycle through tactical loading status strings
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 800);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const now = Date.now();

      // Serve directly from runtime memory cache if fresh
      if (leaderboardCache.data && (now - leaderboardCache.timestamp < CACHE_EXPIRY)) {
        setPlayers(leaderboardCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("all_players_leaderboard")
          .select("*")
          .order("rank", { ascending: true });

        if (error) throw error;
        if (data) {
          // Save parameters to local runtime cache
          leaderboardCache.data = data;
          leaderboardCache.timestamp = now;
          setPlayers(data);
        }
      } catch (error) {
        console.error("Error fetching player leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
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
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
      marginBottom: "10px",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginTop: "10px",
      fontFamily:
        "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      fontSize: "14px",
    },

    th: {
      padding: "10px",
      textAlign: "left" as const,
      fontWeight: 700,
      letterSpacing: "1.5px",
      textTransform: "uppercase" as const,
      fontSize: "12px",
    },

    td: {
      padding: "12px 10px",
      fontWeight: 500,
      letterSpacing: "0.5px",
    },

    // Progress Loader Container Setup
    loaderWrapper: {
      padding: "30px 10px",
      textAlign: "center" as const,
    },

    loaderText: {
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "1.5px",
      color: "#38b222",
      marginBottom: "8px",
    },

    progressBarTrack: {
      width: "100%",
      maxWidth: "300px",
      height: "6px",
      background: "rgba(0,0,0,0.08)",
      borderRadius: "10px",
      margin: "0 auto",
      overflow: "hidden",
      position: "relative" as const,
    },

    progressBarFill: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      height: "100%",
      width: "40%",
      background: "linear-gradient(90deg, #38b222, #ff9f1c)",
      borderRadius: "10px",
      animation: "matchmaking-slide 1.2s infinite ease-in-out",
    },
  };

  return (
    <div style={styles.card}>
      {/* Injected Keyframes for loading bar slide effect */}
      <style>{`
        @keyframes matchmaking-slide {
          0% { left: -40%; width: 30%; }
          50% { width: 40%; }
          100% { left: 100%; width: 20%; }
        }
      `}</style>

      <h2 style={styles.title}>All Players</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Player</th>
            <th style={styles.th}>Gender</th>
            <th style={styles.th}>Clan</th>
            <th style={styles.th}>MP</th>
            <th style={styles.th}>W</th>
            <th style={styles.th}>L</th>
            <th style={styles.th}>D</th>
            <th style={styles.th}>Points</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9}>
                <div style={styles.loaderWrapper}>
                  <div style={styles.loaderText}>
                    {LOADING_PHRASES[phraseIdx]}
                  </div>
                  <div style={styles.progressBarTrack}>
                    <div style={styles.progressBarFill} />
                  </div>
                </div>
              </td>
            </tr>
          ) : players.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ ...styles.td, textAlign: "center" }}>
                No players registered yet.
              </td>
            </tr>
          ) : (
            players.map((p: any, i: number) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td style={styles.td}>#{p.rank}</td>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.gender}</td>
                <td style={styles.td}>{p.clan}</td>
                <td style={styles.td}>{p.mp}</td>
                <td style={styles.td}>{p.w}</td>
                <td style={styles.td}>{p.l}</td>
                <td style={styles.td}>{p.d}</td>
                <td style={styles.td}>{p.points}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}