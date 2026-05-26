import React from "react";

export default function AllPlayersTable() {
  const players = [
    { name: "Kevin", clan: "Alpha Warriors", points: 120 },
    { name: "Brian", clan: "Alpha Warriors", points: 90 },
    { name: "Alex", clan: "Goal Hunters", points: 110 },
    { name: "Mike", clan: "Elite FC", points: 70 },
    { name: "John", clan: "Elite FC", points: 80 },
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
  };

  return (
    <div style={styles.card}>
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
          {players.map((p: any, i: number) => (
            <tr key={i}>
              <td style={styles.td}>{i + 1}</td>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>Male</td>
              <td style={styles.td}>{p.clan}</td>
              <td style={styles.td}>10</td>
              <td style={styles.td}>7</td>
              <td style={styles.td}>2</td>
              <td style={styles.td}>1</td>
              <td style={styles.td}>{p.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}