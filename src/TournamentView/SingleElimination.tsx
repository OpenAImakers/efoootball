"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { Team } from "../pages/Team"; 
import { supabase } from "../supabase";

export default function SingleEliminationLayout({ 
  tournament, 
  teams = [] // Default to empty array to prevent map errors
}: { 
  tournament: any, 
  teams: Team[] 
}) {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMatches() {
      if (!tournament?.id) return;
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id, 
          home_team:home_team_id(name), 
          away_team:away_team_id(name), 
          played, 
          stage,
          home_goals,
          away_goals,
          round
        `)
        .eq("tournament_id", tournament.id)
        .order("round", { ascending: true });

      if (!error) setMatches(data || []);
    }
    fetchMatches();
  }, [tournament?.id]);

  // --- MatchCard with Win/Loss Styling ---
  const MatchCard = ({ match }: { match: any }) => {
    const homeWon = match.played && match.home_goals > match.away_goals;
    const awayWon = match.played && match.away_goals > match.home_goals;

    return (
      <div className="p-3 border rounded shadow-sm bg-white mb-3">
        {/* Home Team */}
        <div className="d-flex justify-content-between align-items-center">
          <span className={`
            ${homeWon ? "fw-bold text-success" : ""} 
            ${awayWon ? "text-danger text-decoration-line-through opacity-75" : ""}
          `}>
            {match.home_team?.name || "TBD"}
          </span>
          <span className={`badge border ${
            homeWon ? "bg-success text-white" : awayWon ? "bg-danger text-white" : "bg-light text-dark"
          }`}>
            {match.played ? match.home_goals : "-"}
          </span>
        </div>

        <hr className="my-2 opacity-25" />

        {/* Away Team */}
        <div className="d-flex justify-content-between align-items-center">
          <span className={`
            ${awayWon ? "fw-bold text-success" : ""} 
            ${homeWon ? "text-danger text-decoration-line-through opacity-75" : ""}
          `}>
            {match.away_team?.name || "TBD"}
          </span>
          <span className={`badge border ${
            awayWon ? "bg-success text-white" : homeWon ? "bg-danger text-white" : "bg-light text-dark"
          }`}>
            {match.played ? match.away_goals : "-"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100 bg-white text-dark d-flex flex-column">
      <nav className="sticky-top bg-white border-bottom shadow-sm">
        <ul className="nav nav-pills justify-content-center gap-4 py-3">
          <li className="nav-item">
            <button className="nav-link active" data-bs-toggle="pill" data-bs-target="#teams-pane">Teams</button>
          </li>
          <li className="nav-item">
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#opening-pane">Qualifiers</button>
          </li>
          <li className="nav-item">
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#championship-pane">Championship</button>
          </li>
        </ul>
      </nav>

      <div className="tab-content flex-grow-1 d-flex flex-column">
        {/* --- TEAMS TAB --- */}
        <div className="tab-pane fade show active flex-grow-1" id="teams-pane">
          <div className="py-5">
            <h2 className="text-center mb-5 fw-bold text-primary">Tournament Participants</h2>
            <div className="container-xl px-3 px-md-5">
              <div className="table-responsive">
                <table className="table table-hover table-bordered border-primary align-middle">
                  <thead>
                    <tr className="table-primary">
                      <th scope="col" className="text-center">#</th>
                      <th scope="col">Team Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams && teams.length > 0 ? (
                      teams.map((team, index) => (
                        <tr key={team.id || index}>
                          <td className="text-center fw-bold text-primary">{index + 1}</td>
                          <td className="fw-medium">{team.name || "Unnamed Team"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center text-muted py-5">No teams registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- QUALIFIERS TAB --- */}
        <div className="tab-pane fade py-5" id="opening-pane">
          <div className="container">
            <h4 className="text-center mb-4 text-primary fw-bold">Opening Matches</h4>
            <div className="row justify-content-center">
              {matches.filter(m => m.stage === "OPENING_ROUND").map(match => (
                <div key={match.id} className="col-md-6 col-lg-4">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- CHAMPIONSHIP TAB --- */}
        <div className="tab-pane fade py-5" id="championship-pane">
          <div className="horizontal-scroll-container d-flex gap-4 px-4 overflow-auto pb-4">
            {Array.from(new Set(matches.filter(m => m.stage === "WINNERS_BRACKET").map(m => m.round)))
              .sort((a, b) => a - b)
              .map(round => (
                <div key={round} style={{ minWidth: "300px" }}>
                  <h5 className="text-center text-primary border-bottom pb-2 mb-3">Round {round}</h5>
                  {matches.filter(m => m.stage === "WINNERS_BRACKET" && m.round === round).map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>

      <style>{`
        body { background: #f8f9fa; }
        .table { background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .table th, .table td { vertical-align: middle; padding: 14px 16px; font-size: 1.05rem; }
        .table thead th { font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.95rem; color: #0d6efd; background-color: #e7f1ff !important; border-bottom: 2px solid #0d6efd; }
        .table tbody tr:hover { background-color: #f0f6ff; }
        .table td:first-child { width: 80px; text-align: center; }
        .nav-pills .nav-link { padding: 10px 28px; border-radius: 50rem; font-weight: 600; color: #6c757d; }
        .nav-pills .nav-link.active { background-color: #0d6efd !important; color: white !important; }
        .horizontal-scroll-container::-webkit-scrollbar { height: 8px; }
        .horizontal-scroll-container::-webkit-scrollbar-thumb { background: #0d6efd; border-radius: 10px; }
      `}</style>
    </div>
  );
}