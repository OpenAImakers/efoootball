import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import Winner from "./Winner";
import MatchPredictions from "./MatchPredictonsTable";

const STAGES = ["GROUP", "QUARTER", "SEMI", "FINAL", "THIRD_PLACE"];

export default function MatchesList() {
  const [tournaments, setTournaments] = useState<{ id: number; name: string }[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [matches, setMatches] = useState<any[]>([]);
  const [groupId, setGroupId] = useState<number>(1);
  const [stage, setStage] = useState("GROUP");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Load tournaments
  useEffect(() => {
    async function loadTournaments() {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (!error && data?.length) {
        setTournaments(data);
        setSelectedTournamentId(data[0].id.toString());
      }
    }
    loadTournaments();
  }, []);

  // Fetch matches
  useEffect(() => {
    if (!selectedTournamentId) {
      setMatches([]);
      return;
    }

    async function fetchMatches() {
      setLoading(true);
      setErrorMsg("");

      try {
        let query = supabase
          .from("matches")
          .select(`
            id,
            home_team:home_team_id(name),
            away_team:away_team_id(name),
            stage,
            group_id,
            played
          `)
          .eq("tournament_id", Number(selectedTournamentId))
          .eq("played", false)
          .order("id", { ascending: true });

        const tournamentIdNum = Number(selectedTournamentId);
        const isMainTournament = tournamentIdNum === 1;

        if (isMainTournament) {
          query = query.eq("stage", stage);
          if (stage === "GROUP") {
            query = query.eq("group_id", groupId);
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        setMatches(data || []);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setErrorMsg("Failed to load matches.");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [selectedTournamentId, stage, groupId]);

  const handleRowClick = (matchId: number) => {
    navigate(`/match/${matchId}/vote`);
  };

  const isMainTournament = Number(selectedTournamentId) === 1;

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="row">
        <div className="col-12 col-lg-11 col-xl-10">
          {/* Tournament Selector */}
          <div className="mb-4">
            <label className="form-label fw-bold">Select Tournament</label>
            <select
              className="form-select"
              value={selectedTournamentId}
              onChange={(e) => {
                setSelectedTournamentId(e.target.value);
                setStage("GROUP");
                setGroupId(1);
              }}
            >
              <option value="">-- Choose Tournament --</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTournamentId && (
            <>
              {isMainTournament && (
                <>
                  {/* Stage Selector */}
                  <div className="mb-4">
                    <div className="btn-group flex-wrap" role="group">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`btn px-4 py-2 ${stage === s ? "btn-primary" : "btn-outline-primary"}`}
                          onClick={() => {
                            setStage(s);
                            if (s !== "GROUP") setGroupId(1);
                          }}
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Group Selector */}
                  {stage === "GROUP" && (
                    <div className="mb-5">
                      <div className="btn-group btn-group-sm" role="group">
                        {[1, 2, 3, 4].map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={`btn px-4 ${groupId === g ? "btn-secondary" : "btn-outline-secondary"}`}
                            onClick={() => setGroupId(g)}
                          >
                            Group {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {loading && (
                <div className="my-5 py-5 d-flex justify-content-center">
                  <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              {!loading && !errorMsg && matches.length === 0 && (
                <div className="alert alert-light border py-5 my-5">
                  <h5 className="text-muted mb-0">
                    No upcoming matches found
                    {isMainTournament && stage === "GROUP" ? ` in Group ${groupId}` : "."}
                  </h5>
                </div>
              )}

              {!loading && matches.length > 0 && (
                <div className="card shadow border-0 overflow-hidden">
                  <div className="card-header bg-dark text-white py-3">
                    <h5 className="mb-0">Click any match to make your prediction</h5>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover table-borderless mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-4 py-3">Home Team</th>
                          <th className="text-center py-3">vs</th>
                          <th className="py-3">Away Team</th>
                          <th className="text-center py-3">Predict</th>
                          {isMainTournament && <th className="text-end pe-4 py-3">Stage</th>}
                        </tr>
                      </thead>
                    <tbody>
                        {matches.map((m) => (
                          <tr
                            key={m.id}
                            onClick={() => handleRowClick(m.id)}
                            className="clickable-row"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") handleRowClick(m.id);
                            }}
                          >
                            <td className="ps-4 fw-semibold">{m.home_team?.name || "—"}</td>
                            <td className="text-center">
                              <span className="badge bg-primary-subtle text-primary border px-3 py-2 fs-6">
                                VS
                              </span>
                            </td>
                            <td className="fw-semibold">{m.away_team?.name || "—"}</td>
                            <td className="text-center">
                              <span className="predict-badge badge bg-success-subtle text-success fw-semibold px-3 py-2">
                                Predict →
                              </span>
                            </td>
                            {isMainTournament && (
                              <td className="text-end pe-4 text-muted small text-uppercase">
                                {m.stage?.replace("_", " ") || "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>


          <div className="p-3">
            <MatchPredictions tournamentId={Number(selectedTournamentId)} />
          </div>
                </div>
              )}
            </>
          )}

          {!selectedTournamentId && (
            <div className="alert alert-info">
              Please select a tournament to view matches.
            </div>
          )}

          {/* Winner component – placed at bottom */}
          <div className="mt-5 w-100">
            <Winner />
          </div>
        </div>
      </div>
    </div>
  );
}