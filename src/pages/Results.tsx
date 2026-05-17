import React from "react";

interface Tournament {
  id: number;
  name: string;
  status: string;
  first_place_prize?: number | null;
  second_place_prize?: number | null;
  third_place_prize?: number | null;
}

interface Team {
  rank: number;
  id: number;
  name: string;
  points: number;
  gf: number;
}

interface ResultsProps {
  tournament: Tournament | null;
  teams: Team[];
}

export default function Results({ tournament, teams }: ResultsProps) {
  if (!tournament || tournament.status !== "finished") {
    return null;
  }

  const topThree = teams.slice(0, 3);

  if (topThree.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-white opacity-75">No results available.</p>
      </div>
    );
  }

  const formatPrize = (amount: number | null | undefined): string => {
    if (!amount || amount <= 0) return "00";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="mt-5 px-3">
      <h3 className="text-center mb-4 text-info fw-bold">FINAL STANDINGS - CHAMPIONSHIP RESULTS</h3>
      <p className="text-center text-white opacity-75 mb-5">
        {tournament.name}
      </p>

      <div className="row justify-content-center g-4">
        {/* 1st Place */}
        {topThree[0] && (
          <div className="col-12 col-md-4">
            <div className="results-card text-center p-4 rounded-4 border border-warning">
              <div className="fs-5 fw-bold text-warning mb-2">1ST PLACE</div>
              <div className="fs-4 fw-bold text-white mb-3">{topThree[0].name}</div>
              
              <div className="mb-4">
                <div className="small opacity-75">POINTS</div>
                <div className="fs-3 fw-bold text-white">{topThree[0].points}</div>
              </div>

              <div>
                <div className="small opacity-75">PRIZE</div>
                <div className="fs-5 fw-bold text-warning">
                  {formatPrize(tournament.first_place_prize)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2nd Place */}
        {topThree[1] && (
          <div className="col-12 col-md-4">
            <div className="results-card text-center p-4 rounded-4 border border-secondary">
              <div className="fs-5 fw-bold text-secondary mb-2">2ND PLACE</div>
              <div className="fs-4 fw-bold text-white mb-3">{topThree[1].name}</div>
              
              <div className="mb-4">
                <div className="small opacity-75">POINTS</div>
                <div className="fs-3 fw-bold text-white">{topThree[1].points}</div>
              </div>

              <div>
                <div className="small opacity-75">PRIZE</div>
                <div className="fs-5 fw-bold text-secondary">
                  {formatPrize(tournament.second_place_prize)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="col-12 col-md-4">
            <div className="results-card text-center p-4 rounded-4 border border-success">
              <div className="fs-5 fw-bold text-success mb-2">3RD PLACE</div>
              <div className="fs-4 fw-bold text-white mb-3">{topThree[2].name}</div>
              
              <div className="mb-4">
                <div className="small opacity-75">POINTS</div>
                <div className="fs-3 fw-bold text-white">{topThree[2].points}</div>
              </div>

              <div>
                <div className="small opacity-75">PRIZE</div>
                <div className="fs-5 fw-bold text-success">
                  {formatPrize(tournament.third_place_prize)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .results-card {
          background: #111;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
        }
        .results-card:hover {
          transform: translateY(-6px);
        }
      `}</style>
    </div>
  );
}