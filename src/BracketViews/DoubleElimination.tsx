"use client";

import React from "react";

/**
 * AUTOMATED TOURNAMENT BRACKET
 * Maps database matches to a Double Elimination visual structure.
 */

interface Match {
  id: string;
  stage: string;
  round: number;
  home_team?: { name: string };
  away_team?: { name: string };
  home_goals?: number;
  away_goals?: number;
  played: boolean;
}

export default function AutomatedTournamentBracket({ matches = [] }: { matches: Match[] }) {
  
  const getMatch = (stage: string, round: number = 1, index: number = 0) => {
    const stageMatches = matches.filter(m => m.stage === stage && Number(m.round) === round);
    return stageMatches[index] || null;
  };

  const openingMatchesInDB = matches.filter(m => m.stage === "OPENING_ROUND");
  
  if (matches.length === 0) {
    return (
      <div style={{...styles.scrollWrapper, justifyContent: 'center', alignItems: 'center'}}>
         <p style={{color: '#666', fontWeight: 'bold'}}>SYNCING BRACKET DATA...</p>
      </div>
    );
  }

  const matchCount = openingMatchesInDB.length || 8; 
  const bracketRoundsCount = Math.log2(matchCount);
  
  const bracketRounds = Array.from({ length: bracketRoundsCount }).map((_, i) => ({
    roundIndex: i + 1,
    matchCount: matchCount / Math.pow(2, i + 1),
  }));

  return (
    <div style={styles.scrollWrapper}>
      <div style={styles.container}>
        
        {/* 1. OPENING ROUND */}
        <div style={{...styles.roundColumn}}>
          <h3 style={styles.roundTitle}>OPENING ROUND</h3>
          <div style={{...styles.matchList, height: '100%', justifyContent: 'space-around', flex: 1}}>
            {Array.from({ length: matchCount }).map((_, i) => (
              <MatchCard 
                key={`opening-${i}`} 
                match={getMatch("OPENING_ROUND", 1, i)} 
                step={0} 
                index={i} 
                showConnector={false} 
              />
            ))}
          </div>
        </div>

        {/* 2. WINNER & LOSER PATHS */}
        {bracketRounds.map((round) => (
          <div key={`round-${round.roundIndex}`} style={styles.roundColumn}>
            <div style={styles.pathSection}>
              <h3 style={{...styles.roundTitle, color: '#28a745'}}>WINNERS R{round.roundIndex}</h3>
              <div style={styles.matchList}>
                {Array.from({ length: round.matchCount }).map((_, i) => (
                  <MatchCard 
                    key={`w-r${round.roundIndex}-${i}`} 
                    match={getMatch("WINNERS_BRACKET", round.roundIndex, i)} 
                    step={round.roundIndex} 
                    index={i}
                    showConnector={round.roundIndex < bracketRoundsCount}
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
                    match={getMatch("LOSERS_BRACKET", round.roundIndex, i)} 
                    step={round.roundIndex} 
                    index={i}
                    showConnector={round.roundIndex < bracketRoundsCount}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* 3. GRAND FINAL */}
        <div style={{...styles.roundColumn, justifyContent: 'center'}}>
          <h3 style={{...styles.roundTitle, color: '#ffc107', marginBottom: '20px'}}>🏆 GRAND FINAL</h3>
          <div style={styles.matchList}>
            <MatchCard match={getMatch("GRAND_FINAL", 1, 0)} isWinner />
          </div>
        </div>

        {/* 4. FINAL RESET */}
        <div style={{...styles.roundColumn, justifyContent: 'center'}}>
          <h3 style={{...styles.roundTitle, color: '#dc3545', marginBottom: '20px'}}>FINAL RESET</h3>
          <div style={styles.matchList}>
            <MatchCard match={getMatch("GRAND_FINAL_RESET", 1, 0)} isWinner />
          </div>
        </div>

      </div>
    </div>
  );
}

function MatchCard({ match, step = 0, index = 0, isWinner = false, showConnector = true }: any) {
  const baseGap = 20; 
  const vMargin = step === 0 ? 5 : (Math.pow(2, step) - 1) * 45 + baseGap;
  const connectorHeight = Math.pow(2, step) * 44; 
  const isTopMatch = index % 2 === 0;

  const homeName = match?.home_team?.name || "";
  const awayName = match?.away_team?.name || "";
  const homeScore = match?.played ? match.home_goals : "";
  const awayScore = match?.played ? match.away_goals : "";

  // Win/Loss Color Logic
  const getScoreStyle = (score: any, opponentScore: any) => {
    if (!match?.played || score === "" || opponentScore === "") return styles.scoreText;
    const s = Number(score);
    const os = Number(opponentScore);
    if (s > os) return { ...styles.scoreText, color: "#28a745" }; // Green for win
    if (s < os) return { ...styles.scoreText, color: "#dc3545" }; // Red for loss
    return styles.scoreText;
  };

  return (
    <div style={{ ...styles.matchWrapper, margin: `${vMargin}px 0` }}>
      <div style={{ 
        ...styles.card, 
        borderColor: isWinner ? "#ffc107" : "#0d6efd",
        opacity: match ? 1 : 0.2 
      }}>
        {/* HOME TEAM */}
        <div style={{ ...styles.teamSlot, borderBottom: "1px solid #222" }}>
          <span style={styles.seed}>H</span>
          <span style={styles.teamText}>{homeName}</span>
          <span style={getScoreStyle(homeScore, awayScore)}>{homeScore}</span>
        </div>
        {/* AWAY TEAM */}
        <div style={styles.teamSlot}>
          <span style={styles.seed}>A</span>
          <span style={styles.teamText}>{awayName}</span>
          <span style={getScoreStyle(awayScore, homeScore)}>{awayScore}</span>
        </div>
      </div>
      
      {!isWinner && showConnector && (
        <div 
          style={{
            ...styles.connector,
            height: `${connectorHeight}px`,
            borderWidth: isTopMatch ? "2px 2px 0 0" : "0 2px 2px 0",
            top: isTopMatch ? "50%" : "auto",
            bottom: isTopMatch ? "auto" : "50%",
            borderRadius: isTopMatch ? "0 15px 0 0" : "0 0 15px 0",
            opacity: match ? 1 : 0.1
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
    justifyContent: "space-between" 
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
    alignItems: "center",
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
    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
    transition: "all 0.3s ease"
  },
  teamSlot: { 
    padding: "12px", 
    fontSize: "0.85rem", 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    color: "#fff",
    minHeight: '45px'
  },
  teamText: { 
    fontWeight: "700",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1
  },
  scoreText: {
    fontWeight: "900",
    color: "#0d6efd", // Default color if not played
    minWidth: "25px",
    textAlign: "right",
    fontSize: "1rem"
  },
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
    transition: "all 0.3s ease"
  }
};