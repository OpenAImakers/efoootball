import React from "react";

export default function ClanPlayersTable({ selected, setSelected }: any) {
  const s = [
    { name: "Alpha Warriors" },
    { name: "Goal Hunters" },
    { name: "Elite FC" },
  ];

  // Added distinct country values while keeping the filtering property intact
  const players = [
    { name: "Kevin", clan: "Alpha Warriors", place: "Kenya" },
    { name: "Brian", clan: "Alpha Warriors", place: "Nigeria" },
    { name: "Alex",  clan: "Goal Hunters",   place: "Ghana" },
    { name: "Mike",  clan: "Elite FC",       place: "South Africa" },
    { name: "John",  clan: "Elite FC",       place: "Egypt" },
  ];

  const styles = {
    card: {
      background: "transparent",
      border: "none",
      padding: "15px",
      marginBottom: "20px",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
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
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
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

    filterBtn: {
      marginRight: "10px",
      padding: "8px 12px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
      fontSize: "12px",
      transition: "all 0.2s ease",
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
    },
  };

  // Filters by the player's assigned clan group
  const filteredPlayers = players.filter((p) => p.clan === selected);

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Clan Players</h2>

      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {s.map((c: any, i: number) => {
          const isActive = selected === c.name;

          return (
            <button
              key={i}
              style={{
                ...styles.filterBtn,
                border: isActive
                  ? "2px solid #000"
                  : "2px solid transparent",
                opacity: isActive ? 1 : 0.75,
                fontWeight: isActive ? 800 : 600,
              }}
              onClick={() => setSelected(c.name)}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            {/* Added width constraints to keep columns tightly aligned to the left */}
            <th style={{ ...styles.th, width: "200px" }}>Player</th>
            <th style={styles.th}>Place</th>
          </tr>
        </thead>

        <tbody>
          {filteredPlayers.map((p: any, i: number) => (
            <tr key={i}>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.place}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}