import { useEffect, useState } from "react";
import { fetchMatchesByLeague, Match } from "../MatchesApi";

export default function MatchesList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await fetchMatchesByLeague(1);
        setMatches(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
  }, []);

  if (loading) return <div className="text-center mt-5 text-warning p-5">Loading Live Scores...</div>;
  if (error) return <div className="alert alert-danger m-3">Error: {error}</div>;

  return (
    <div className="container-fluid py-3" style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <h6 className="text-uppercase fw-bold m-0" style={{ color: "#00ff00", letterSpacing: "1px" }}>
          Matches
        </h6>
        <span className="badge" style={{ backgroundColor: "#333", color: "#FFA500" }}>
          Predictions Soon
        </span>
      </div>

      {matches.length === 0 ? (
        <p className="text-center text-muted">No scheduled matches today.</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {matches.map((match) => (
            <div 
              key={match.id} 
              className="p-3 d-flex align-items-center justify-content-between shadow-sm"
              style={{ 
                backgroundColor: "#1e1e1e", 
                borderRadius: "8px", 
                borderLeft: "4px solid #FFA500" 
              }}
            >
              {/* Time/Status Column */}
              <div className="text-center" style={{ minWidth: "60px" }}>
                <div className="fw-bold text-light small">
                  {new Date(match.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#888" }}>FT</div>
              </div>

              {/* Teams Column */}
              <div className="flex-grow-1 px-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-light fw-semibold">{match.home_team}</span>
                  <span className="text-warning fw-bold">0</span> {/* Placeholder for live score */}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-light fw-semibold">{match.away_team}</span>
                  <span className="text-warning fw-bold">0</span>
                </div>
              </div>

              {/* Odds/Betting Section (Sporty Style) */}
              <div className="d-flex gap-1 ms-2">
                <OddBox label="1" value={match.odds_home} />
                <OddBox label="X" value={match.odds_draw} />
                <OddBox label="2" value={match.odds_away} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Small helper component for the betting-style boxes
function OddBox({ label, value }: { label: string, value: any }) {
  return (
    <div 
      className="text-center d-flex flex-column justify-content-center"
      style={{ 
        width: "45px", 
        height: "45px", 
        backgroundColor: "#2a2a2a", 
        borderRadius: "4px",
        border: "1px solid #333"
      }}
    >
      <span style={{ fontSize: "0.6rem", color: "#888", display: "block" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color: "#FFA500", fontWeight: "bold" }}>{value ?? "-"}</span>
    </div>
  );
}