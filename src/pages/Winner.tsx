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

  if (loading)
    return (
      <div className="text-center mt-5 text-light">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading matches...</p>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-danger text-center mt-3">
        Error: {error}
      </div>
    );

  return (
    <div className="container mt-4">
      {/* Coming Soon Disclaimer */}
      <div className="text-center mb-4">
        <span
          style={{
            color: "#FFA500",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
           Matches predictions coming soon!
        </span>
      </div>

      {matches.length === 0 ? (
        <p className="text-center text-light">No matches found.</p>
      ) : (
        <div className="row g-3">
          {matches.map((match) => (
            <div key={match.id} className="col-12 col-md-6 col-lg-4">
              <div
                className="card bg-dark text-light h-100"
                style={{
                  border: "2px solid #FFA500",
                  borderRadius: "12px",
                }}
              >
                <div className="card-body">
                  <h5 className="card-title text-center mb-3">
                    {match.home_team} <span className="text-warning">vs</span>{" "}
                    {match.away_team}
                  </h5>

                  <p className="card-text text-center">
                    Odds:{" "}
                    <span className="text-warning">
                      {match.odds_home ?? "-"} | {match.odds_draw ?? "-"} |{" "}
                      {match.odds_away ?? "-"}
                    </span>
                  </p>

                  <p className="card-text text-center text-muted">
                    {new Date(match.event_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}