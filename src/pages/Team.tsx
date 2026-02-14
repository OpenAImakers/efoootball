"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import MatchesTimer from "./MatchesTimer";

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

const target = new Date("2026-01-02T16:00:00").getTime();

export default function Teams() {
  const [tournaments, setTournaments] = useState<{ id: number; name: string }[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<{ id: number; name: string } | null>(null);
  const [standings, setStandings] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"table" | "upcoming" | "played">("table");

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase.from("tournaments").select("id, name");
      if (data && data.length > 0) {
        setTournaments(data);
        setSelectedTournament(data[0]);
      }
    };
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: standData } = await supabase.rpc("get_standings", {
          t_id: selectedTournament.id,
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
          .eq("tournament_id", selectedTournament.id)
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
  }, [selectedTournament]);

  const groupMatchesByRound = (matchesArray: Match[]) => {
    return matchesArray.reduce((groups: { [key: string]: Match[] }, match) => {
      const roundLabel = match.round ? `Round ${match.round}` : "Other Matches";
      if (!groups[roundLabel]) groups[roundLabel] = [];
      groups[roundLabel].push(match);
      return groups;
    }, {});
  };

  const filteredMatches = matches.filter((m) => (activeTab === "played" ? m.played : !m.played));
  const groupedMatches = groupMatchesByRound(filteredMatches);

  return (
    <main className="mt-5 bg-black text-white min-vh-100">
      <Navbar />

      <style>
        {`
          .gaming-select {
            background: #111 !important;
            color: #0d6efd !important;
            border: 2px solid #0d6efd !important;
            border-radius: 10px;
            font-weight: bold;
            padding: 12px;
            box-shadow: 0 0 15px rgba(13, 110, 253, 0.2);
          }
          .nav-pills .nav-link { color: #fff; opacity: 0.6; border-radius: 20px; transition: 0.3s; }
          .nav-pills .nav-link.active { background-color: #0d6efd !important; opacity: 1; transform: scale(1.05); }
          .beaten { color: #ff4d4d !important; text-decoration: line-through; opacity: 0.5; }
          .match-box { background: #111; border: 1px solid #222; border-radius: 12px; transition: 0.3s; }
          .match-box:hover { border-color: #0d6efd; transform: translateY(-3px); }
          .round-header { border-left: 4px solid #0d6efd; padding-left: 15px; margin-top: 40px; margin-bottom: 20px; color: #0d6efd; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          
          /* Full width adjustments */
          .full-width-container {
            padding-left: 15px;
            padding-right: 15px;
            width: 100%;
          }
          .table thead th { font-size: 0.85rem; text-transform: uppercase; }
        `}
      </style>

      {/* Changed container to container-fluid for full width */}
      <div className="container-fluid full-width-container py-5">
        <div className="mb-4 text-center">
          <label className="d-block small text-uppercase text-muted mb-2 tracking-widest">Select Tournament</label>
          <select
            className="form-select gaming-select mx-auto"
            style={{ maxWidth: "450px" }}
            value={selectedTournament?.id}
            onChange={(e) => {
              const t = tournaments.find((x) => x.id === parseInt(e.target.value));
              if (t) setSelectedTournament(t);
            }}
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <MatchesTimer targetTime={target} />

        <ul className="nav nav-pills justify-content-center mt-5 mb-4 gap-2">
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
            {/* 1. STANDINGS TABLE */}
            {activeTab === "table" && (
              <div className="bg-dark w-100 border border-primary rounded-4 overflow-hidden shadow-lg">
                <div className="table-responsive">
                  <table className="table table-dark mb-0 align-middle table-hover text-center">
                    <thead className="table-primary text-dark">
                      <tr>
                        <th>Rank</th>
                        <th className="text-start ps-4">Team</th>
                        <th>MP</th> {/* Added MP Header */}
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
                      {standings.map((team) => (
                        <tr key={team.id}>
                          <td className="fw-bold">{team.rank}</td>
                          <td className="text-start ps-4">{team.name}</td>
                          {/* Matches Played Calculation: W + D + L */}
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
            )}

            {/* 2. MATCHES Section full-width container */}
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
                            <div key={match.id} className="col-md-6 col-lg-4 col-xl-3">
                              <div className="match-box p-3 text-center">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className={`fw-bold flex-fill ${homeLost ? "beaten" : ""}`}>{match.home_team?.name}</span>
                                  <div className="mx-2">
                                    {match.played ? (
                                      <span className="badge bg-primary px-3 py-2">{match.home_goals} - {match.away_goals}</span>
                                    ) : (
                                      <span className="badge bg-secondary">VS</span>
                                    )}
                                  </div>
                                  <span className={`fw-bold flex-fill ${awayLost ? "beaten" : ""}`}>{match.away_team?.name}</span>
                                </div>
                                <div className="mt-2 opacity-50 small text-uppercase">{match.stage}</div>
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
    </main>
  );
}