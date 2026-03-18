"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Tournament } from "../pages/Team"; // Adjust this path to your actual teams page path

interface Team {
  id: number;
  name: string;
  rank: number;
  w: number;
  d: number;
  l: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
  group_id?: number | string; // Added to support grouping
}

interface Match {
  id: number;
  home_team: { name: string };
  away_team: { name: string };
  played: boolean;
  stage: string;
  home_goals: number;
  away_goals: number;
  round: string | number;
}

export default function RoundRobinLayout({ tournament }: { tournament: Tournament }) {
  const [standings, setStandings] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"table" | "upcoming" | "played">("table");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: standData } = await supabase.rpc("get_standings", {
          t_id: tournament.id,
        });

        const { data: matchData } = await supabase
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
          .order("round", { ascending: true })
          .order("id", { ascending: true });

        setStandings(standData || []);
        setMatches((matchData as any) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournament]);

  const groupMatchesByRound = (matchesArray: Match[]) => {
    return matchesArray.reduce((groups: { [key: string]: Match[] }, match) => {
      const roundLabel = match.round ? `Round ${match.round}` : "Other Matches";
      if (!groups[roundLabel]) groups[roundLabel] = [];
      groups[roundLabel].push(match);
      return groups;
    }, {});
  };

  // NEW: Group teams by group_id
  const groupTeamsByGroup = (teamsArray: Team[]) => {
    return teamsArray.reduce((groups: { [key: string]: Team[] }, team) => {
      const gid = team.group_id || "General";
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push(team);
      return groups;
    }, {});
  };

  const filteredMatches = matches.filter((m) => (activeTab === "played" ? m.played : !m.played));
  const groupedMatches = groupMatchesByRound(filteredMatches);
  const groupedStandings = groupTeamsByGroup(standings);

  return (
    <div className="container-fluid px-0">
      <style>{`
        .nav-pills .nav-link { 
          color: #adb5bd !important; 
          font-weight: 800; 
          border-radius: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 4px solid transparent;
          transition: 0.3s ease;
          padding: 10px 20px;
          background: transparent !important;
        }
        .nav-pills .nav-link.active { 
          color: #0d6efd !important; 
          border-bottom: 4px solid #0d6efd;
          opacity: 1;
        }
        .nav-pills .nav-link:hover:not(.active) { 
          color: #fff !important; 
        }

        .beaten { color: #ff4d4d !important; text-decoration: line-through; opacity: 0.5; }
        .match-box { background: #111; border: 1px solid #222; border-radius: 12px; transition: 0.3s; }
        .match-box:hover { border-color: #0d6efd; transform: translateY(-3px); }
        .round-header { border-left: 4px solid #0d6efd; padding-left: 15px; margin-top: 40px; margin-bottom: 20px; color: #0d6efd; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
        .table thead th { font-size: 0.85rem; text-transform: uppercase; }
        .group-title { color: #fff; background: #0d6efd; padding: 5px 15px; display: inline-block; border-radius: 0 10px 10px 0; margin-bottom: 10px; font-weight: bold; }
      `}</style>

      <ul className="nav nav-pills justify-content-center mt-2 mb-4 gap-2">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "table" ? "active" : ""}`} onClick={() => setActiveTab("table")}>Standings</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "upcoming" ? "active" : ""}`} onClick={() => setActiveTab("upcoming")}>Upcoming</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "played" ? "active" : ""}`} onClick={() => setActiveTab("played")}>Results</button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="mt-4">
          {activeTab === "table" && (
            <div className="standings-container">
              {Object.entries(groupedStandings).sort().map(([groupId, teams]) => (
                <div key={groupId} className="mb-5">
                  {Number(groupId) >= 1 && <div className="group-title">GROUP {groupId}</div>}
                  <div className="bg-dark w-100 border border-primary rounded-4 overflow-hidden shadow-lg">
                    <div className="table-responsive">
                      <table className="table table-dark mb-0 align-middle table-hover text-center">
                        <thead className="table-primary text-dark">
                          <tr>
                            <th>Rank</th>
                            <th className="text-start ps-4">Team</th>
                            <th>MP</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>PTS</th>
                            <th>GF</th>
                            <th>GA</th>
                            <th>GD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((team, index) => (
                            <tr key={team.id}>
                              <td className="fw-bold">{index + 1}</td>
                              <td className="text-start ps-4">{team.name}</td>
                              <td className="text-info fw-bold">{team.w + team.d + team.l}</td>
                              <td>{team.w}</td>
                              <td>{team.d}</td>
                              <td>{team.l}</td>
                              <td className="fw-bold text-warning" style={{ fontSize: '1.1rem' }}>{team.points}</td>
                              <td>{team.gf}</td>
                              <td>{team.ga}</td>
                              <td>{team.gd}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === "upcoming" || activeTab === "played") && (
            <div className="px-md-4">
              {Object.keys(groupedMatches).length > 0 ? (
                Object.entries(groupedMatches).map(([round, roundMatches]) => (
                  <div key={round} className="mb-5">
                    <h4 className="round-header">{round}</h4>
                    <div className="row g-3">
                      {roundMatches.map((match) => {
                        const homeLost = match.played && match.home_goals < match.away_goals;
                        const awayLost = match.played && match.away_goals < match.home_goals;

                        return (
                          <div key={match.id} className="d-flex align-items-center mb-3">
                            <div className="d-flex align-items-center gap-2" style={{ flex: 1, justifyContent: "flex-start", minWidth: 0 }}>
                              <img src="/teamlogo.png" alt="team" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", flexShrink: 0 }} />
                              <span className={`fw-bold ${homeLost ? "beaten" : ""}`} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {match.home_team?.name}
                              </span>
                            </div>

                            <div style={{ width: "90px", textAlign: "center", flexShrink: 0 }}>
                              {match.played ? (
                                <span className="badge bg-primary px-3 py-2">{match.home_goals} - {match.away_goals}</span>
                              ) : (
                                <span className="badge bg-secondary px-3 py-2">VS</span>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-2" style={{ flex: 1, justifyContent: "flex-end", minWidth: 0 }}>
                              <span className={`fw-bold ${awayLost ? "beaten" : ""}`} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {match.away_team?.name}
                              </span>
                              <img src="/teamlogo.png" alt="team" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", flexShrink: 0 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-5">No matches found for this category.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}