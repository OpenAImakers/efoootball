import { useEffect, useState, useMemo } from "react";
import { fetchGlobalMatches, Match } from "../MatchesApi";
import Navbar from "../components/Navbar";

interface League {
  id: number | string;
  name: string;
  country: string;
}

export default function MatchesList() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | string | "global">("global");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const data = await fetchGlobalMatches();
        setAllMatches(data);

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

  const displayedMatches = useMemo(() => {
    if (selectedLeague === "global") return allMatches;
    return allMatches.filter(m => (m.league?.id || m.league?.name) === selectedLeague);
  }, [selectedLeague, allMatches]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <div className="min-vh-100 bg-light d-flex flex-column" style={{ overflow: "hidden" }}>
      <Navbar />
      <div className="container-fluid py-4 mt-5 flex-grow-1" style={{ height: "100vh" }}>
        <div className="row g-3 h-100">
          
          {/* LEFT: Leagues Sidebar */}
          <div className="col-lg-3 col-xl-2 h-100">
            <div className="card border-0 shadow-sm rounded-3 h-100 d-flex flex-column">
              <div className="card-header bg-white py-3 border-bottom">
                <h6 className="mb-0 fw-bold text-uppercase small text-muted">Leagues</h6>
              </div>
              
              <div className="flex-grow-1 overflow-auto">
                <div className="list-group list-group-flush">
                  <button
                    onClick={() => setSelectedLeague("global")}
                    className={`list-group-item list-group-item-action border-0 py-3 px-3 small fw-bold ${selectedLeague === "global" ? "bg-primary text-white" : "text-dark"}`}
                  >
                    All Events
                  </button>
                  {leagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => setSelectedLeague(league.id)}
                      className={`list-group-item list-group-item-action border-0 py-2 px-3 small ${selectedLeague === league.id ? "bg-primary-subtle text-primary border-end border-primary border-3" : "text-secondary"}`}
                    >
                      {league.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Match Cards Area */}
          <div className="col-lg-9 col-xl-10 h-100 d-flex flex-column">
            <div className="card border-0 shadow-sm rounded-3 h-100 d-flex flex-column">
              {/* Table Header Alignment */}
              <div className="card-header bg-white py-3 border-bottom d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold">
                     {selectedLeague === "global" ? "Upcoming Matches" : leagues.find(l => l.id === selectedLeague)?.name}
                  </h6>
                </div>
                <div className="d-flex gap-2 text-center" style={{ width: "210px" }}>
                  <div className="fw-bold small text-muted" style={{ width: "65px" }}>1</div>
                  <div className="fw-bold small text-muted" style={{ width: "65px" }}>X</div>
                  <div className="fw-bold small text-muted" style={{ width: "65px" }}>2</div>
                </div>
              </div>

              <div className="card-body p-0 overflow-auto flex-grow-1 bg-white">
                {error ? (
                  <div className="alert alert-danger m-3">{error}</div>
                ) : (
                  <div className="d-flex flex-column">
                    {displayedMatches.map((match) => (
                      <div key={match.id} className="match-row d-flex align-items-center px-3 py-2 border-bottom transition-all">
                        
                        {/* Time Section */}
                        <div className="py-1" style={{ width: "80px" }}>
                          <div className="fw-bold text-dark small">
                            {new Date(match.event_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-muted" style={{ fontSize: "0.65rem" }}>
                            {new Date(match.event_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </div>
                        </div>

                        {/* Teams Section */}
                        <div className="flex-grow-1 px-3">
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-dark h6 mb-0" style={{ fontSize: "0.9rem" }}>{match.home_team}</span>
                            <span className="fw-semibold text-dark h6 mb-0" style={{ fontSize: "0.9rem" }}>{match.away_team}</span>
                          </div>
                        </div>

                        {/* Odds Grid */}
                        <div className="d-flex gap-2">
                          <OddBox value={match.odds_home} />
                          <OddBox value={match.odds_draw} />
                          <OddBox value={match.odds_away} />
                        </div>
                      </div>
                    ))}
                    {displayedMatches.length === 0 && (
                      <div className="text-center py-5 text-muted small">No matches found for this league.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .match-row:hover { background-color: #fcfcfc; }
        .match-row { border-left: 3px solid transparent; }
        .match-row:hover { border-left: 3px solid #0d6efd; }
        .odd-button:hover { background-color: #e9ecef !important; border-color: #0d6efd !important; color: #0d6efd !important; }
        .transition-all { transition: all 0.15s ease-in-out; }
      `}</style>
    </div>
  );
}

function OddBox({ value }: { value: any }) {
  return (
    <button className="btn p-0 d-flex align-items-center justify-content-center border rounded-2 odd-button transition-all"
      style={{ 
        width: "65px", 
        height: "45px", 
        backgroundColor: "#f8f9fa",
        fontSize: "0.9rem",
        fontWeight: "700"
      }}>
      {value ?? "-"}
    </button>
  );
}