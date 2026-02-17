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
  const [, setLoading] = useState(true);

  // 1. Fetch matches for this specific tournament
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
      setLoading(false);
    }

    fetchMatches();
  }, [tournament?.id]);

  // 2. Reusable sub-component to show matches for a specific stage
  const MatchList = ({ stageKey }: { stageKey: string }) => {
    const filtered = matches.filter(m => m.stage === stageKey);
    
    if (filtered.length === 0) {
      return <p className="text-muted mt-3">No matches scheduled for this stage.</p>;
    }

    return (
      <div className="mt-3">
        {filtered.map((match) => (
          <div key={match.id} className="card bg-dark border-secondary mb-2">
            <div className="card-body d-flex justify-content-between align-items-center py-2 px-3">
              <div className="text-white small fw-bold" style={{width: '30px'}}>R{match.round}</div>
              <div className="text-end flex-grow-1 pe-3 text-white">{match.home_team?.name}</div>
              <div className="badge bg-secondary px-3 py-2 mx-2" style={{minWidth: '70px'}}>
                {match.played ? `${match.home_goals} - ${match.away_goals}` : "VS"}
              </div>
              <div className="text-start flex-grow-1 ps-3 text-white">{match.away_team?.name}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">

        {/* LEFT SIDE TABS */}
        <div className="col-md-3 mb-3">
          <div className="nav flex-column nav-pills me-3 gap-2" id="v-pills-tab" role="tablist" aria-orientation="vertical">
            <button className="nav-link active" id="teams-tab" data-bs-toggle="pill" data-bs-target="#teams-list" type="button" role="tab">
              Tournament Teams
            </button>
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#opening" type="button" role="tab">
              Opening Round 
            </button>
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#winners" type="button" role="tab">
              Winners Bracket
            </button>
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#losers" type="button" role="tab">
              Losers Bracket
            </button>
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#grandfinal" type="button" role="tab">
              Grand Final
            </button>
            <button className="nav-link" data-bs-toggle="pill" data-bs-target="#reset" type="button" role="tab">
              Grand Final Reset
            </button>
          </div>
        </div>

        {/* RIGHT SIDE CONTENT */}
        <div className="col-md-9">
          <div className="tab-content mt-1" id="v-pills-tabContent">

            {/* TEAMS TABLE */}
            <div className="tab-pane fade show active" id="teams-list" role="tabpanel">
              <h4>Participating Teams</h4>
              <div className="table-responsive bg-dark border border-secondary rounded-3">
                <table className="table table-dark table-hover mb-0 align-middle">
                  <thead className="table-secondary text-dark">
                    <tr>
                      <th className="ps-3">Team Name</th>
                      <th className="text-center">W</th>
                      <th className="text-center">L</th>
                      <th className="text-center">D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={team.id}>
                        <td className="ps-3 fw-bold">{team.name}</td>
                        <td className="text-center text-success">{team.w}</td>
                        <td className="text-center text-danger">{team.l}</td>
                        <td className="text-center text-info">{team.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MATCH TABS */}
            <div className="tab-pane fade" id="opening" role="tabpanel">
              <h4>Opening Round</h4>
              <MatchList stageKey="OPENING_ROUND" />
            </div>

            <div className="tab-pane fade" id="winners" role="tabpanel">
              <h4>Winners Bracket</h4>
              <MatchList stageKey="WINNERS_BRACKET" />
            </div>

            <div className="tab-pane fade" id="losers" role="tabpanel">
              <h4>Losers Bracket</h4>
              <MatchList stageKey="LOSERS_BRACKET" />
            </div>

            <div className="tab-pane fade" id="grandfinal" role="tabpanel">
              <h4>Grand Final</h4>
              <MatchList stageKey="GRAND_FINAL" />
            </div>

            <div className="tab-pane fade" id="reset" role="tabpanel">
              <h4>Grand Final Reset</h4>
              <MatchList stageKey="GRAND_FINAL_RESET" />
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .nav-pills .nav-link { color: #adb5bd; text-align: left; border: 1px solid transparent; }
        .nav-pills .nav-link.active { background-color: #0d6efd !important; border-color: #0d6efd; }
        .nav-pills .nav-link:hover:not(.active) { background-color: #212529; color: #fff; }
      `}</style>
    </div>
  );
}