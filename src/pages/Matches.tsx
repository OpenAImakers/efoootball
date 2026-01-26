import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function MatchesList() {
  const [matches, setMatches] = useState([]);

  async function fetchData() {
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`
        id, 
        home_team:home_team_id(name), 
        away_team:away_team_id(name), 
        played, 
        stage
      `)
      .eq("played", false)
      .order("id", { ascending: false });

    setMatches(matchesData || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="matches-container">
      <b>Upcoming Matches</b>

      {matches.length === 0 ? (
        <p>No unplayed matches</p>
      ) : (
        <div style={{ padding: "20px", color: "#fff" }}>
          <div
            className="matches-list"
            style={{
              display: "flex",
              gap: "15px",
              overflowX: "auto",
              paddingBottom: "10px",
            }}
          >
            {matches.map((match) => (
              <div
                key={match.id}
                className="match-card"
                style={{
                  minWidth: "250px",
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "15px",
                  borderRadius: "12px",
                  background: "#1B2240",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  border: "1px solid #00BFFF",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#fff" }}>
                    {match.home_team?.name || "Unknown"}{" "}
                    <span style={{ color: "#00BFFF" }}>vs</span>{" "}
                    {match.away_team?.name || "Unknown"}
                  </div>
                  <div style={{ fontSize: "14px", color: "#aaa", marginTop: "4px" }}>
                    Stage: <span style={{ fontWeight: "bold", color: "#00BFFF" }}>{match.stage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}