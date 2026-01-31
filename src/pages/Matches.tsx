import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import MatchPredictions from "./MatchPredictonsTable";
const STAGES = ["GROUP", "QUARTER", "SEMI", "FINAL", "THIRD_PLACE"];

export default function MatchesList() {
  const [matches, setMatches] = useState<any[]>([]);
  const [groupId, setGroupId] = useState<number>(1);
  const [stage, setStage] = useState("GROUP");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
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
          .eq("played", false)
          .eq("stage", stage)
          .order("id", { ascending: true });

        if (stage === "GROUP") {
          query = query.eq("group_id", groupId);
        }

        const { data, error } = await query;
        if (error) throw error;

        setMatches(data || []);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setErrorMsg("Failed to load matches. Try again.");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [groupId, stage]);

  const handleRowClick = (matchId: number) => {
    navigate(`/match/${matchId}/vote`);
  };

  return (
    <div className="container-fluid">
      <div className="row ">
        <div className="col-lg-10 col-xl-9">

          {/* Stage Selector */}
          <div className="d-flex justify-content-center justify-content-lg-start mb-4">
            <div className="btn-group flex-wrap shadow-sm" role="group">
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
            <div className="d-flex justify-content-center justify-content-lg-start mb-5">
              <div className="btn-group btn-group-sm shadow-sm" role="group">
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

          {loading && (
            <div className="text-center my-5 py-5">
              <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger shadow-sm text-center">{errorMsg}</div>
          )}

          {!loading && !errorMsg && matches.length === 0 && (
            <div className="alert alert-light border shadow-sm text-center py-5 my-5">
              <h5 className="text-muted mb-0">
                No upcoming matches found {stage === "GROUP" ? `in Group ${groupId}` : "."}
              </h5>
            </div>
          )}

          {!loading && matches.length > 0 && (
            <div className="card shadow border-0 overflow-hidden">
              <div className="card-header bg-dark text-white py-3">
                <h5 className="mb-0 text-center">Click any match to make your prediction</h5>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-borderless mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4 py-3">Home Team</th>
                      <th className="text-center py-3">vs</th>
                      <th className="py-3">Away Team</th>
                      <th className="text-center py-3">Predict</th>
                      <th className="text-end pe-4 py-3">Stage</th>
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

                        <td className="text-end pe-4 text-muted small text-uppercase">
                          {m.stage.replace("_", " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3">
                <MatchPredictions />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}