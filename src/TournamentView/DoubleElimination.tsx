import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import { Team } from "../pages/Team"; 
import { supabase } from "../supabase";

export default function DoubleEliminationLayout({ 
  tournament, 
  teams 
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

  // Specialized Match Card Component
  const MatchCard = ({ match }: { match: any }) => {
    const isPlayed = match.played;
    const homeGoals = match.home_goals ?? 0;
    const awayGoals = match.away_goals ?? 0;

    // Logic for Score Colors
    const getScoreClass = (current: number, opponent: number) => {
      if (!isPlayed) return "score-pending";
      if (current > opponent) return "score-win";
      if (current < opponent) return "score-loss";
      return "score-draw";
    };

    return (
      <div className="match-card-anime">
        <div className={`match-team home ${isPlayed && homeGoals < awayGoals ? 'beaten-team' : ''}`}>
          <span className="team-name text-truncate">{match.home_team?.name || "TBD"}</span>
          <span className={`score ${getScoreClass(homeGoals, awayGoals)}`}>
            {isPlayed ? homeGoals : "-"}
          </span>
        </div>
        <div className="match-divider"></div>
        <div className={`match-team away ${isPlayed && awayGoals < homeGoals ? 'beaten-team' : ''}`}>
          <span className="team-name text-truncate">{match.away_team?.name || "TBD"}</span>
          <span className={`score ${getScoreClass(awayGoals, homeGoals)}`}>
            {isPlayed ? awayGoals : "-"}
          </span>
        </div>
      </div>
    );
  };

  // Flexible Match List Component
  const MatchList = ({ stageKey, useRounds = true }: { stageKey: string, useRounds?: boolean }) => {
    const filteredMatches = matches.filter(m => m.stage === stageKey);

    if (filteredMatches.length === 0) {
      return <p className="text-muted mt-5 text-center anime-fade-in">No matches scheduled yet.</p>;
    }

    if (!useRounds) {
      return (
        <div className="container mt-3 pb-5">
          <div className="row justify-content-center g-3">
            {filteredMatches.map(match => (
              <div key={match.id} className="col-12 col-md-8 col-lg-6">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    const groupedRounds: { [key: number]: any[] } = {};
    filteredMatches.forEach(m => {
        if (!groupedRounds[m.round]) groupedRounds[m.round] = [];
        groupedRounds[m.round].push(m);
    });
    const roundNumbers = Object.keys(groupedRounds).sort((a, b) => Number(a) - Number(b));

    return (
      <div className="horizontal-scroll-container d-flex pb-4 px-3 gap-4">
        {roundNumbers.map((round) => (
          <div key={round} className="round-column flex-shrink-0">
            <h5 className="round-label text-center mb-3">ROUND {round}</h5>
            <div className="d-flex flex-column gap-3">
              {groupedRounds[Number(round)].map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid px-0 bg-black min-vh-100">
      <ul className="nav nav-pills justify-content-center gap-2 py-3 border-bottom border-secondary sticky-top bg-black" style={{zIndex: 1000}}>
        <li className="nav-item">
          <button className="nav-link active" data-bs-toggle="pill" data-bs-target="#teams-list">STANDINGS</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="pill" data-bs-target="#opening">OPENING</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="pill" data-bs-target="#winners">WINNERS</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="pill" data-bs-target="#losers">LOSERS</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="pill" data-bs-target="#grandfinal">GRAND FINAL</button>
        </li>
        <li className="nav-item">
          <button className="nav-link" data-bs-toggle="pill" data-bs-target="#reset">RESET</button>
        </li>
      </ul>

      <div className="tab-content pt-4">
        <div className="tab-pane fade show active px-2" id="teams-list">
          <div className="table-responsive w-100 border border-secondary rounded-4 overflow-hidden shadow-lg">
            <table className="table table-dark table-hover mb-0 align-middle text-nowrap">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="ps-4">RANK</th>
                  <th>TEAM</th>
                  <th className="text-center">MP</th>
                  <th className="text-center">W</th>
                  <th className="text-center">D</th>
                  <th className="text-center">L</th>
                  <th className="text-center">GF</th>
                  <th className="text-center">GA</th>
                  <th className="text-center">GD</th>
                  <th className="text-center pe-4 text-warning">PTS</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className="ps-4 fw-bold">#{team.rank}</td>
                    <td className="fw-bold text-info">{team.name}</td>
                    <td className="text-center">{team.w + team.d + team.l}</td>
                    <td className="text-center">{team.w}</td>
                    <td className="text-center">{team.d}</td>
                    <td className="text-center">{team.l}</td>
                    <td className="text-center">{team.gf}</td>
                    <td className="text-center">{team.ga}</td>
                    <td className={`text-center fw-bold ${team.gd >= 0 ? 'text-success' : 'text-danger'}`}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="text-center pe-4 fw-bold text-warning">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tab-pane fade" id="opening">
            <h4 className="text-center text-primary mb-4 fw-bold tracking-widest">QUALIFIERS</h4>
            <MatchList stageKey="OPENING_ROUND" useRounds={false} />
        </div>

        <div className="tab-pane fade" id="winners">
            <MatchList stageKey="WINNERS_BRACKET" />
        </div>

        <div className="tab-pane fade" id="losers">
            <MatchList stageKey="LOSERS_BRACKET" />
        </div>

        <div className="tab-pane fade" id="grandfinal">
            <h4 className="text-center text-warning mb-4 fw-bold tracking-widest">🏆 GRAND FINAL</h4>
            <MatchList stageKey="GRAND_FINAL" useRounds={false} />
        </div>

        <div className="tab-pane fade" id="reset">
            <h4 className="text-center text-danger mb-4 fw-bold tracking-widest">FINAL RESET</h4>
            <MatchList stageKey="GRAND_FINAL_RESET" useRounds={false} />
        </div>
      </div>

      <style>{`
        .horizontal-scroll-container {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #0d6efd #111;
          min-height: 400px;
        }
        .round-column { width: 320px; }
        .round-label {
          color: #0d6efd;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          border-bottom: 2px solid #0d6efd;
          padding-bottom: 8px;
        }
        .match-card-anime {
          background: linear-gradient(145deg, #1a1a1a 0%, #000 100%);
          border-left: 5px solid #0d6efd;
          border-radius: 10px;
          padding: 14px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 5px 15px rgba(0,0,0,0.6);
        }
        .match-card-anime:hover {
          transform: translateY(-5px) scale(1.02);
          border-left-color: #ffc107;
          box-shadow: 0 8px 25px rgba(13, 110, 253, 0.25);
        }
        .match-team { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; }
        .team-name { color: #fff; font-weight: 600; font-size: 0.95rem; max-width: 75%; transition: 0.3s; }
        
        .score { font-weight: 900; font-size: 1.2rem; min-width: 25px; text-align: right; transition: 0.3s; }
        .score-win { color: #28a745; }
        .score-loss { color: #dc3545; }
        .score-draw { color: #ffffff; }
        .score-pending { color: #0d6efd; }

        .match-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 8px 0; }
        
        .beaten-team .team-name {
          color: #555 !important;
        }

        .nav-pills .nav-link { 
          color: #666; 
          font-weight: 800; 
          border-radius: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 4px solid transparent;
          transition: 0.3s ease;
          padding: 12px 15px;
          font-size: 0.85rem;
        }
        .nav-pills .nav-link.active { 
          background: none !important; 
          color: #0d6efd !important; 
          border-bottom: 4px solid #0d6efd;
        }
        .nav-pills .nav-link:hover:not(.active) { color: #fff; }
        .tracking-widest { letter-spacing: 4px; }
        .anime-fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}