"use client";

import React from "react";

/**
 * CONFIGURATION: 
 * Set 'matchCount' to 4, 8, or 16.
 */
const CONFIG = {
  matchCount: 8, 
  teamPool1: ["1", "2", "3", "4", "5", "6", "7", "8"],
  teamPool2: ["A", "B", "C", "D", "E", "F", "G", "H"],
};

export default function AutomatedTournamentBracket() {
  const openingMatches = Array.from({ length: CONFIG.matchCount }).map((_, i) => ({
    id: `opening-${i}`,
    teams: [`Team ${CONFIG.teamPool1[i] || i + 1}`, `Team ${CONFIG.teamPool2[i] || '?'}`],
  }));

  const bracketRoundsCount = Math.log2(CONFIG.matchCount);
  const bracketRounds = Array.from({ length: bracketRoundsCount }).map((_, i) => {
    return {
      roundIndex: i + 1,
      matchCount: CONFIG.matchCount / Math.pow(2, i + 1),
    };
  });

  return (
    <div style={styles.scrollWrapper}>
      <div style={styles.container}>
        
        {/* OPENING ROUND - No Connectors */}
        <div style={styles.roundColumn}>
          <h3 style={styles.roundTitle}>OPENING ROUND</h3>
          <div style={styles.matchList}>
            {openingMatches.map((m, i) => (
              <MatchCard 
                key={m.id} 
                teams={m.teams} 
                step={0} 
                index={i} 
                showConnector={false} 
              />
            ))}
          </div>
        </div>

        {/* AUTOMATED WINNER & LOSER PATHS */}
        {bracketRounds.map((round) => (
          <div key={`round-${round.roundIndex}`} style={styles.roundColumn}>
            <div style={styles.pathSection}>
              <h3 style={{...styles.roundTitle, color: '#28a745'}}>WINNERS R{round.roundIndex}</h3>
              <div style={styles.matchList}>
                {Array.from({ length: round.matchCount }).map((_, i) => (
                  <MatchCard 
                    key={`w-r${round.roundIndex}-${i}`} 
                    teams={["Winner", "Winner"]} 
                    step={round.roundIndex} 
                    index={i}
                    showConnector={round.roundIndex < bracketRoundsCount}
                    isFinalPath={round.roundIndex === bracketRoundsCount}
                    pathType="winner"
                  />
                ))}
              </div>
            </div>

            <div style={styles.pathSection}>
              <h3 style={{...styles.roundTitle, color: '#dc3545'}}>LOSERS R{round.roundIndex}</h3>
              <div style={styles.matchList}>
                {Array.from({ length: round.matchCount }).map((_, i) => (
                  <MatchCard 
                    key={`l-r${round.roundIndex}-${i}`} 
                    teams={["Loser", "Loser"]} 
                    step={round.roundIndex} 
                    index={i}
                    showConnector={round.roundIndex < bracketRoundsCount}
                    isFinalPath={round.roundIndex === bracketRoundsCount}
                    pathType="loser"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* GRAND FINAL - Centered Vertically */}
        <div style={{...styles.roundColumn, justifyContent: 'center'}}>
          <h3 style={{...styles.roundTitle, color: '#ffc107', marginBottom: '20px'}}>🏆 GRAND FINAL</h3>
          <div style={styles.matchList}>
            <MatchCard teams={["Winner Path", "Loser Path"]} isWinner />
          </div>
        </div>

      </div>
    </div>
  );
}

function MatchCard({ 
  teams, 
  step = 0, 
  index = 0, 
  isWinner = false, 
  showConnector = true, 
  isFinalPath = false, 
  pathType = "" 
}: any) {
  const baseGap = 20; 
  const vMargin = (Math.pow(2, step) - 1) * 45 + baseGap;
  const connectorHeight = Math.pow(2, step) * 44; 
  const isTopMatch = index % 2 === 0;

  return (
    <div style={{ ...styles.matchWrapper, margin: `${vMargin}px 0` }}>
      <div style={{ ...styles.card, borderColor: isWinner ? "#ffc107" : "#0d6efd" }}>
        {teams.map((team: string, i: number) => (
          <div 
            key={i} 
            style={{ 
              ...styles.teamSlot, 
              borderBottom: i === 0 ? "1px solid #222" : "none" 
            }}
          >
            <span style={styles.seed}>{i + 1}</span>
            <span style={styles.teamText}>{team}</span>
          </div>
        ))}
      </div>
      
      {/* Elbow connectors for earlier rounds only */}
      {!isWinner && showConnector && (
        <div 
          style={{
            ...styles.connector,
            height: `${connectorHeight}px`,
            borderWidth: isTopMatch ? "2px 2px 0 0" : "0 2px 2px 0",
            top: isTopMatch ? "50%" : "auto",
            bottom: isTopMatch ? "auto" : "50%",
            borderRadius: isTopMatch ? "0 15px 0 0" : "0 0 15px 0",
          }} 
        />
      )}


    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrollWrapper: { 
    width: "100%", 
    overflowX: "auto", 
    backgroundColor: "#000", 
    minHeight: "100vh", 
    display: 'flex' 
  },
  container: { 
    display: "flex", 
    flexDirection: "row", 
    padding: "80px 50px", 
    gap: "100px", 
    minWidth: "max-content", 
    alignItems: 'stretch' 
  },
  roundColumn: { 
    display: "flex", 
    flexDirection: "column", 
    width: "220px", 
    justifyContent: "space-around" 
  },
  pathSection: { 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    flex: 1 
  },
  roundTitle: { 
    fontSize: "0.7rem", 
    letterSpacing: "2px", 
    textAlign: "center", 
    textTransform: "uppercase", 
    fontWeight: "900", 
    color: "#0d6efd", 
    marginBottom: "10px" 
  },
  matchList: { 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  matchWrapper: { 
    position: "relative", 
    display: "flex", 
    alignItems: "center" 
  },
  card: { 
    backgroundColor: "#0a0a0a", 
    border: "2px solid #0d6efd", 
    borderRadius: "8px", 
    width: "220px", 
    zIndex: 2, 
    boxShadow: "0 0 20px rgba(0,0,0,0.5)" 
  },
  teamSlot: { 
    padding: "12px", 
    fontSize: "0.85rem", 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    color: "#fff" 
  },
  teamText: { fontWeight: "700" },
  seed: { 
    fontSize: "0.5rem", 
    color: "#0d6efd", 
    border: "1px solid #0d6efd", 
    padding: "1px 4px", 
    borderRadius: "3px", 
    minWidth: "18px", 
    textAlign: 'center' 
  },
  connector: {
    position: "absolute",
    right: "-100px",
    width: "100px",
    borderColor: "#0d6efd",
    borderStyle: "solid",
    boxShadow: "0 0 10px rgba(13, 110, 253, 0.2)",
    zIndex: 1,
  }
};