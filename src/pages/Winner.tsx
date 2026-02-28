import { useEffect, useState, useMemo } from "react";
import { fetchGlobalMatches, Match } from "../MatchesApi";

interface League {
  id: number | string;
  name: string;
  country: string;
}

export default function MatchesList() {
  // Store the master list of all matches
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | string | "global">("global");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // 1. Initial Fetch: Get EVERYTHING at once
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const data = await fetchGlobalMatches();
        setAllMatches(data);

        // Extract unique leagues from the master list
        const leagueMap: Record<string, League> = {};
        data.forEach((m) => {
          if (m.league?.name && !leagueMap[m.league.name]) {
            leagueMap[m.league.name] = {
              id: m.league.id || m.league.name,
              name: m.league.name,
              country: m.league.country ?? "",
            };
          }
        });
        setLeagues(Object.values(leagueMap));
      } catch (err: any) {
        setError(err.message || "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // 2. Client-side Filtering: Instant tab switching
  const displayedMatches = useMemo(() => {
    if (selectedLeague === "global") return allMatches;
    return allMatches.filter(m => (m.league?.id || m.league?.name) === selectedLeague);
  }, [selectedLeague, allMatches]);

  // Only show full loading for the very first visit
  if (loading) return <div className="text-center mt-5 text-warning p-5">Loading Sports Data...</div>;
  if (error) return <div className="alert alert-danger m-3">Error: {error}</div>;

  return (
    <div className="container-fluid py-3" style={{  minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <h6 className="text-uppercase fw-bold m-0" style={{ color: "#00ff00", letterSpacing: "1px" }}>
          {selectedLeague === "global" ? "All Leagues" : leagues.find(l => l.id === selectedLeague)?.name}
        </h6>
        <span className="badge" style={{ backgroundColor: "#333", color: "#FFA500" }}>Live</span>
      </div>

      {/* Tabs - Now Instant */}
      <div className="d-flex gap-2 flex-wrap mb-3" style={{ maxHeight: '120px', overflowY: 'auto' }}>
        <button 
          className={`btn btn-sm ${selectedLeague === "global" ? "btn-warning" : "btn-outline-secondary text-dark"}`}
          onClick={() => setSelectedLeague("global")}
        >All</button>
        {leagues.map((league) => (
          <button
            key={league.id}
            className={`btn btn-sm ${selectedLeague === league.id ? "btn-warning" : "btn-outline-secondary text-dark"}`}
            onClick={() => setSelectedLeague(league.id)}
          >{league.name}</button>
        ))}
      </div>

      {/* Match List */}
      <div className="d-flex flex-column gap-2">
        {displayedMatches.length === 0 ? (
          <p className="text-center text-muted mt-4">No scheduled matches for this selection.</p>
        ) : (
          displayedMatches.map((match) => (
            <div key={match.id} className="p-3 d-flex align-items-center justify-content-between shadow-sm"
              style={{ backgroundColor: "#1e1e1e", borderRadius: "8px", borderLeft: "4px solid #FFA500" }}>
              
              <div className="text-center" style={{ minWidth: "65px" }}>
                <div className="fw-bold text-light small">
                  {new Date(match.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#888" }}>{match.league?.name}</div>
              </div>

              <div className="flex-grow-1 px-3 border-start border-secondary ms-2">
                <div className="text-light fw-semibold small">{match.home_team}</div>
                <div className="text-light fw-semibold small">{match.away_team}</div>
              </div>

              <div className="d-flex gap-1">
                <OddBox label="1" value={match.odds_home} />
                <OddBox label="X" value={match.odds_draw} />
                <OddBox label="2" value={match.odds_away} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OddBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-center d-flex flex-column justify-content-center"
      style={{ width: "42px", height: "42px", backgroundColor: "#2a2a2a", borderRadius: "4px", border: "1px solid #333" }}>
      <span style={{ fontSize: "0.55rem", color: "#888" }}>{label}</span>
      <span style={{ fontSize: "0.8rem", color: "#FFA500", fontWeight: "bold" }}>{value ?? "-"}</span>
    </div>
  );
}