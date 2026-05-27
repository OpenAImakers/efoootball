import React from "react";

export default function ClanPlayersProfile({ selected, setSelected }: any) {
  const clans = [
    { name: "Alpha Warriors" },
    { name: "Goal Hunters" },
    { name: "Elite FC" },
  ];

  const players = [
    { name: "Kevin", clan: "Alpha Warriors", place: "Kenya", age: 19 },
    { name: "Brian", clan: "Alpha Warriors", place: "Nigeria", age: 21 },
    { name: "Alex", clan: "Goal Hunters", place: "Ghana", age: 20 },
    { name: "Mike", clan: "Elite FC", place: "South Africa", age: 22 },
    { name: "John", clan: "Elite FC", place: "Egypt", age: 18 },
  ];

  const filteredPlayers = players.filter((p) => p.clan === selected);

  const styles: any = {
    wrapper: {
      padding: "15px",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
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
    },

    // ✅ Updated Image Styles
    imageContainer: {
      width: "100%",
      padding: "20px 20px 10px 20px", // Gives breathing space
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
    },

    image: {
      width: "100%",           // Full width of container
      maxWidth: "180px",       // Controls max size
      height: "180px",         // Fixed square size
      objectFit: "contain",    // ✅ Fully visible, no cropping
      borderRadius: "12px",
      border: "3px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
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
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Clan Players</h2>

      {/* Clan filters */}
      <div style={styles.filters}>
        {clans.map((c, i) => {
          const active = selected === c.name;
          return (
            <button
              key={i}
              onClick={() => setSelected(c.name)}
              style={{
                ...styles.filterBtn,
                opacity: active ? 1 : 0.7,
                border: active ? "2px solid #000" : "2px solid transparent",
              }}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Player Cards */}
      <div style={styles.grid}>
        {filteredPlayers.map((p, i) => (
          <div key={i} style={styles.card}>
            {/* Centered Image Container */}
            <div style={styles.imageContainer}>
              <img 
                src="/profile.png" 
                alt={p.name} 
                style={styles.image} 
              />
            </div>

            <div style={styles.content}>
              <div style={styles.name}>{p.name}</div>

              <div style={styles.row}>
                <span style={styles.label}>Country:</span>
                {p.place}
              </div>

              <div style={styles.row}>
                <span style={styles.label}>Age:</span>
                {p.age}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}