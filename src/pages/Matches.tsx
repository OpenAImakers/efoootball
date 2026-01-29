import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";   // ← ADD THIS

const STAGES = ["GROUP", "QUARTER", "SEMI", "FINAL", "THIRD_PLACE"];

export default function MatchesList() {
  const [matches, setMatches] = useState<any[]>([]);
  const [groupId, setGroupId] = useState<number>(1);
  const [stage, setStage] = useState("GROUP");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();   // ← ADD THIS

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
    <div className="container mt-4">
      <h2 className="mb-4 text-primary fw-bold">Upcoming Matches</h2>

      {/* Stage Selector */}
      <div className="btn-group mb-3 flex-wrap" role="group">
        {STAGES.map((s) => (
          <button
            key={s}
            type="button"
            className={`btn ${stage === s ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => {
              setStage(s);
              if (s !== "GROUP") setGroupId(1);
            }}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Group Selector */}
      {stage === "GROUP" && (
        <div className="mb-4">
          <div className="btn-group btn-group-sm" role="group">
            {[1, 2, 3, 4].map((g) => (
              <button
                key={g}
                type="button"
                className={`btn ${groupId === g ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setGroupId(g)}
              >
                Group {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {errorMsg && <div className="alert alert-danger shadow-sm">{errorMsg}</div>}

      {!loading && !errorMsg && matches.length === 0 && (
        <div className="alert alert-light border text-center py-5">
          <p className="text-muted mb-0">
            No upcoming matches found {stage === "GROUP" ? `in Group ${groupId}` : ""}.
          </p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="ps-4">Home Team</th>
                <th className="text-center">vs</th>
                <th>Away Team</th>
                <th className="text-end pe-4">Stage</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => handleRowClick(m.id)}
                  style={{ cursor: "pointer" }}           // ← makes it look clickable
                  className="hover-bg-light"              // optional: add hover class
                >
                  <td className="fw-bold ps-4">{m.home_team?.name || "—"}</td>
                  <td className="text-center">
                    <span className="badge bg-light text-primary border">VS</span>
                  </td>
                  <td className="fw-bold">{m.away_team?.name || "—"}</td>
                  <td className="text-end pe-4">
                    <span className="text-uppercase small text-muted">
                      {m.stage.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}