import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

function TeamsManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamGroup, setNewTeamGroup] = useState("1");

  // Load tournaments once on mount
  useEffect(() => {
    async function fetchTournaments() {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tournaments:", error);
        return;
      }

      setTournaments(data || []);

      // Auto-select newest if nothing chosen yet
      if (data?.length > 0 && selectedTournamentId === null) {
        setSelectedTournamentId(data[0].id);
      }
    }
    fetchTournaments();
  }, []);

  // Fetch teams function (callable from anywhere)
  const refreshTeams = async () => {
    if (selectedTournamentId === null) {
      setTeams([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", selectedTournamentId)
      .order("group_id", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching teams:", error);
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  };

  // Initial fetch when tournament is first selected
  useEffect(() => {
    if (selectedTournamentId !== null) {
      refreshTeams();
    }
  }, []); // empty deps — only once on mount

  const currentTournament = tournaments.find((t) => t.id === selectedTournamentId);

  const handleChange = (id, field, value) =>
    setTeams((prev) =>
      prev.map((team) => (team.id === id ? { ...team, [field]: value } : team))
    );

  const handleSave = async (team) => {
    if (!window.confirm(`Save updated stats for ${team.name}?`)) return;

    const { error } = await supabase
      .from("teams")
      .update({
        w: parseInt(team.w) || 0,
        l: parseInt(team.l) || 0,
        d: parseInt(team.d) || 0,
      })
      .eq("id", team.id);

    if (error) {
      alert("Error updating: " + error.message);
    } else {
      alert("Stats updated!");
      // Optional: refresh after save
      refreshTeams();
    }
  };

  const handleAddTeam = async () => {
    if (selectedTournamentId === null) {
      return alert("Please select a tournament first.");
    }
    if (!newTeamName.trim()) return alert("Enter a team name");

    const { error } = await supabase.from("teams").insert({
      name: newTeamName.trim(),
      tournament_id: selectedTournamentId,
      group_id: parseInt(newTeamGroup),
      w: 0,
      l: 0,
      d: 0,
    });

    if (error) {
      alert("Error adding team: " + error.message);
    } else {
      setNewTeamName("");
      refreshTeams(); // ← auto refresh after add
    }
  };

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Delete ${name} and ALL its matches? This cannot be undone.`)) return;

    try {
      await supabase
        .from("matches")
        .delete()
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`);

      const { error } = await supabase.from("teams").delete().eq("id", id);

      if (error) throw error;

      alert(`${name} deleted successfully`);
      refreshTeams(); // ← auto refresh after delete
    } catch (err) {
      alert("Error deleting team: " + err.message);
    }
  };

  const groups = {};
  teams.forEach((team) => {
    const gid = team.group_id || "Ungrouped";
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(team);
  });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2>Tournament Control Panel</h2>

        <div className="d-flex align-items-center gap-3">
          <select
            className="form-select"
            value={selectedTournamentId ?? ""}
            onChange={(e) => {
              setSelectedTournamentId(e.target.value ? Number(e.target.value) : null);
              // No need to refresh here — useEffect will handle on next render if needed
            }}
          >
            <option value="">Select Tournament</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {currentTournament && (
            <span className="badge bg-primary fs-6">
              {teams.length} teams
            </span>
          )}

          {/* Manual refresh button */}
          {selectedTournamentId !== null && (
            <button className="btn btn-outline-secondary btn-sm" onClick={refreshTeams} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Teams"}
            </button>
          )}
        </div>
      </div>

      {!selectedTournamentId && (
        <div className="alert alert-info">
          Please select a tournament to manage teams.
        </div>
      )}

      {selectedTournamentId !== null && (
        <>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Add Team Section */}
              <div className="card mb-5 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title small fw-bold text-uppercase mb-3">
                    Add New Team to {currentTournament?.name || "Selected Tournament"}
                  </h5>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Team Name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={newTeamGroup}
                        onChange={(e) => setNewTeamGroup(e.target.value)}
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            Group {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <button className="btn btn-dark w-100" onClick={handleAddTeam}>
                        Add Team
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Groups / Teams Display */}
              <div className="row">
                {Object.keys(groups)
                  .sort()
                  .map((groupId) => (
                    <div key={groupId} className="col-lg-6 mb-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                          <h6 className="mb-0 fw-bold">
                            GROUP {groupId} {groupId === "Ungrouped" && "(No group assigned)"}
                          </h6>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr className="small text-uppercase">
                                <th>Team</th>
                                <th style={{ width: "60px" }}>W</th>
                                <th style={{ width: "60px" }}>L</th>
                                <th style={{ width: "60px" }}>D</th>
                                <th className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groups[groupId].map((team) => (
                                <tr key={team.id}>
                                  <td className="fw-bold">{team.name}</td>
                                  {["w", "l", "d"].map((f) => (
                                    <td key={f}>
                                      <input
                                        type="number"
                                        min="0"
                                        className="form-control form-control-sm text-center px-1"
                                        value={team[f]}
                                        onChange={(e) =>
                                          handleChange(team.id, f, e.target.value)
                                        }
                                      />
                                    </td>
                                  ))}
                                  <td className="text-end">
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => handleSave(team)}
                                      >
                                        Save
                                      </button>
                                      <button
                                        className="btn btn-outline-danger"
                                        onClick={() =>
                                          handleDeleteTeam(team.id, team.name)
                                        }
                                      >
                                        Delete
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

              {teams.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <p>No teams in this tournament yet.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default TeamsManager;