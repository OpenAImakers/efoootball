import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabase";

export default function ClanPlayersProfile({
  selected,
  setSelected,
}: any) {
  const [clans, setClans] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Client-side cache to keep swapping instant
  const cache = useRef<{ [key: string]: any[] }>({});

  // LOAD CLANS
  useEffect(() => {
    const fetchClans = async () => {
      try {
        const { data, error } = await supabase
          .from("clans")
          .select("id, clan_name")
          .order("clan_name", { ascending: true });

        if (error) throw error;

        setClans(data || []);
      } catch (err) {
        console.error("Error loading clans:", err);
      }
    };

    fetchClans();
  }, []);

  // LOAD PLAYERS FROM VIEW WITH CACHING
  useEffect(() => {
    if (!selected) {
      setPlayers([]);
      return;
    }

    // Return cached data immediately if it exists
    if (cache.current[selected]) {
      setPlayers(cache.current[selected]);
      setLoading(false);
      return;
    }

    const fetchPlayers = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("clan_players_profiles")
          .select("*")
          .eq("clan", selected)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const results = data || [];
        cache.current[selected] = results; // Save to local storage cache
        setPlayers(results);
      } catch (err) {
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [selected]);

  const styles: any = {
    wrapper: {
      padding: "15px",
      fontFamily:
        "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      color: "#111111",
    },

    title: {
      fontSize: "20px",
      fontWeight: 800,
      letterSpacing: "1.2px",
      textTransform: "uppercase",
      marginBottom: "10px",
    },

    filters: {
      marginBottom: "15px",
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },

    filterBtn: {
      padding: "8px 12px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontSize: "12px",
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
      color: "#000",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "18px",
    },

    card: {
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: "16px",
      overflow: "hidden",
      backdropFilter: "blur(10px)",
      transition: "0.2s ease",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    },

    imageContainer: {
      width: "100%",
      padding: "20px 20px 10px 20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
    },

    image: {
      width: "100%",
      maxWidth: "180px",
      height: "180px",
      objectFit: "contain",
      borderRadius: "12px",
      border: "3px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      background: "#fff",
    },

    content: {
      padding: "12px 14px",
    },

    name: {
      fontSize: "18px",
      fontWeight: 900,
      letterSpacing: "1px",
      marginBottom: "10px",
      textTransform: "uppercase" as const,
    },

    row: {
      fontSize: "13px",
      marginBottom: "6px",
      opacity: 0.9,
    },

    label: {
      fontWeight: 800,
      marginRight: "5px",
    },

    genderBadge: {
      display: "inline-block",
      marginTop: "8px",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(56,178,34,0.15)",
      color: "#1d7f11",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },

    empty: {
      padding: "20px",
      textAlign: "center" as const,
      opacity: 0.7,
      fontWeight: "700",
    },

    // Skeleton specific styles
    skeletonImage: {
      width: "100%",
      maxWidth: "180px",
      height: "180px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.2)",
      animation: "pulse 1.5s infinite ease-in-out",
    },

    skeletonText: {
      height: "16px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: "4px",
      marginBottom: "10px",
      animation: "pulse 1.5s infinite ease-in-out",
    },
  };

  return (
    <div style={styles.wrapper}>
      {/* Dynamic Keyframes injected safely for the pulse effect */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>

      <h2 style={styles.title}>Clan Players</h2>

      {/* Clan Filters */}
      <div style={styles.filters}>
        {clans.map((c, i) => {
          const active = selected === c.clan_name;

          return (
            <button
              key={i}
              onClick={() => setSelected(c.clan_name)}
              style={{
                ...styles.filterBtn,
                opacity: active ? 1 : 0.7,
                border: active
                  ? "2px solid #000"
                  : "2px solid transparent",
              }}
            >
              {c.clan_name}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && selected && players.length === 0 && (
        <div style={styles.empty}>
          Select your clan to view Players
        </div>
      )}

      {/* Player Cards & Skeleton Loader Grid */}
      <div style={styles.grid}>
        {loading
          ? // Render 3 structured skeleton profile elements while loading
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} style={styles.card}>
                <div style={styles.imageContainer}>
                  <div style={styles.skeletonImage} />
                </div>
                <div style={styles.content}>
                  <div style={{ ...styles.skeletonText, width: "60%", height: "20px" }} />
                  <div style={{ ...styles.skeletonText, width: "80%" }} />
                  <div style={{ ...styles.skeletonText, width: "40%" }} />
                </div>
              </div>
            ))
          : // Render verified live loaded results
            players.map((p, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.imageContainer}>
                  <img
                    src={p.player_avatar || "/profile.png"}
                    alt={p.name}
                    style={styles.image}
                  />
                </div>

                <div style={styles.content}>
                  <div style={styles.name}>{p.name}</div>

                  <div style={styles.row}>
                    <span style={styles.label}>Country:</span>
                    {p.place || "Unknown"}
                  </div>

                  <div style={styles.row}>
                    <span style={styles.label}>Age:</span>
                    {p.age || "N/A"}
                  </div>

                  {p.gender && (
                    <div style={styles.genderBadge}>
                      {p.gender}
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}