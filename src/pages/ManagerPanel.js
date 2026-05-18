import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { getActiveTournament } from "../Utils/TournamentSession";

function TeamsManager() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // States for importing registration records
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [selectedRegId, setSelectedRegId] = useState("");
  const [importing, setImporting] = useState(false);
  const [userId, setUserId] = useState(null);

  const activeSession = getActiveTournament();
  const activeTournamentId = activeSession?.id || null;

  // Initialize Session User
  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getSession();
  }, []);

  // Fetch parent configurations created by this admin context along with tournament_id
  const fetchMyRegistrations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("registrations")
      .select("id, name, tournament_id")
      .eq("created_by", userId);
    if (data) setMyRegistrations(data);
  }, [userId]);

  useEffect(() => {
    fetchMyRegistrations();
  }, [userId, fetchMyRegistrations]);

  // Fetch structural data of teams bound to active context
  const refreshTeams = useCallback(async () => {
    if (!activeTournamentId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", activeTournamentId)
      .order("group_id", { ascending: true })
      .order("name", { ascending: true });

    if (!error) setTeams(data || []);
    setLoading(false);
  }, [activeTournamentId]);

  useEffect(() => {
    if (activeTournamentId) {
      refreshTeams();
    }
  }, [activeTournamentId, refreshTeams]);

  // Streamlined Pipeline Execution leveraging Database Triggers
  const handleImportTeams = async () => {
    if (!selectedRegId || !activeTournamentId) return;

    setImporting(true);
    
    // Simply update the tournament_id on the chosen registration record.
    // The Database Trigger takes care of conditions 1, 2, and 3 instantly.
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ tournament_id: activeTournamentId })
      .eq("id", selectedRegId);

    setImporting(false);

    if (updateError) {
      alert("Error linking registration: " + updateError.message);
    } else {
      alert("Successfully linked registration! Teams have been auto-populated via trigger.");
      fetchMyRegistrations(); 
      refreshTeams();
    }
  };

  const handleChange = (id, field, value) => {
    setTeams((prev) =>
      prev.map((team) => (team.id === id ? { ...team, [field]: value } : team))
    );
  };

  const handleSave = async (team) => {
    if (!window.confirm(`Save stats for ${team.name}?`)) return;
    const { error } = await supabase
      .from("teams")
      .update({
        name: team.name,
        group_id: parseInt(team.group_id) || 0,
        w: parseInt(team.w) || 0,
        l: parseInt(team.l) || 0,
        d: parseInt(team.d) || 0,
      })
      .eq("id", team.id);

    if (error) alert(error.message);
    else refreshTeams();
  };

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await supabase
      .from("matches")
      .delete()
      .or(`home_team_id.eq.${id},away_team_id.eq.${id}`);
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (!error) refreshTeams();
  };

  const groups = {};
  teams.forEach((team) => {
    const gid = team.group_id || 0;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(team);
  });

  // Determine if a registration has already been linked to this active tournament context
  const isAlreadyImported = myRegistrations.some(
    (reg) => reg.tournament_id === activeTournamentId
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">
          {activeSession?.name ? `Managing: ${activeSession.name}` : "Teams Manager"}
        </h2>
      </div>

      {loading && teams.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : !activeTournamentId ? (
        <div className="text-center py-5 bg-light rounded">
          <p className="text-muted">No active tournament session found.</p>
        </div>
      ) : (
        <>
          {/* IMPORT CONTROL BAR INTERFACE */}
          {!isAlreadyImported && (
            <div className="card mb-4 shadow-sm border-0 bg-dark text-white">
              <div className="card-body">
                <h6 className="mb-3 text-uppercase tracking-wider">
                  <i className="bi bi-download me-2"></i>Import Approved Sign-ups
                </h6>
                <div className="row g-2">
                  <div className="col-md-8">
                    <select
                      className="form-select bg-secondary text-white border-0"
                      value={selectedRegId}
                      onChange={(e) => setSelectedRegId(e.target.value)}
                    >
                      <option value="">Select Registration Form Source...</option>
                      {myRegistrations.map((reg) => (
                        <option key={reg.id} value={reg.id} className="text-dark">
                          {reg.name} (Form ID: #{reg.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-primary w-100 fw-bold text-uppercase"
                      onClick={handleImportTeams}
                      disabled={!selectedRegId || importing}
                    >
                      {importing ? "Importing Data..." : "Execute Import"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GROUPS SCHEDULING MANAGEMENT BLOCK */}
          <div className="row">
            {Object.keys(groups)
              .sort((a, b) => (a === "0" ? 1 : b === "0" ? -1 : a - b))
              .map((groupId) => (
                <div key={groupId} className="col-lg-4 col-md-6 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white fw-bold text-primary d-flex justify-content-between align-items-center">
                      <span>{groupId === "0" ? "All Teams" : `Group ${groupId}`}</span>
                      <span className="badge bg-light text-dark border">{groups[groupId].length} Teams</span>
                    </div>
                    <div className="table-responsive">
  <table className="table align-middle mb-0">
    <thead>
      <tr className="small text-muted">
        <th style={{ minWidth: "220px" }}>Team</th>
        <th style={{ width: "90px" }}>Grp</th>
        <th style={{ width: "55px" }}>W</th>
        <th style={{ width: "55px" }}>L</th>
        <th style={{ width: "55px" }}>D</th>
        <th style={{ width: "90px" }} />
      </tr>
    </thead>

    <tbody>
      {groups[groupId].map((team) => (
        <tr key={team.id}>
          <td>
<div
  className="bg-light fw-semibold py-2 px-3"
  style={{
    minWidth: "220px",
    borderRadius: "10px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "0.95rem",
  }}
>
  {team.name}
</div>
          </td>

          <td>
            <select
              className="form-select form-select-sm border-0 bg-light"
              style={{
                width: "85px",
                borderRadius: "10px",
              }}
              value={team.group_id ?? 0}
              onChange={(e) =>
                handleChange(team.id, "group_id", e.target.value)
              }
            >
              <option value="0">No Group</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </td>

          {["w", "l", "d"].map((f) => (
            <td key={f}>
              <input
                type="number"
                className="form-control form-control-sm text-center border-0 bg-light"
                style={{
                  width: "48px",
                  borderRadius: "10px",
                }}
                value={team[f] ?? 0}
                onChange={(e) =>
                  handleChange(team.id, f, e.target.value)
                }
              />
            </td>
          ))}

          <td className="text-end">
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-sm btn-success rounded-pill px-2 py-1 fw-semibold"
                onClick={() => handleSave(team)}
              >
                Save
              </button>

              <button
                className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1 fw-semibold"
                onClick={() =>
                  handleDeleteTeam(team.id, team.name)
                }
              >
                Del
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TeamsManager;