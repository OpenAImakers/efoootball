import React from "react";

export default function ClanRankingsTable() {
  const s = [
    { name: "Alpha Warriors", rank: 1 },
    { name: "Goal Hunters", rank: 2 },
    { name: "Elite FC", rank: 3 },
  ];

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
  };

  return (
    <div style={styles.card}>
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
          {s.map((c: any, i: number) => (
            <tr key={i}>
              <td style={{ ...styles.td, fontWeight: 700 }}>
                #{c.rank}
              </td>
              <td style={{ ...styles.td, fontWeight: 600 }}>
                {c.name}
              </td>
              <td style={styles.td}>10</td>
              <td style={styles.td}>7</td>
              <td style={styles.td}>2</td>
              <td style={styles.td}>1</td>
              <td style={styles.td}>{120 - i * 10}</td>
              <td style={styles.td}>{20 - i * 5}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}