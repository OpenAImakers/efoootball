import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

function TeamsManager() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamGroup, setNewTeamGroup] = useState(1);

  async function fetchTeams() {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("group_id", { ascending: true })
      .order("name", { ascending: true });

    if (error) console.error(error);
    else setTeams(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTeams();
  }, []);

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

    if (error) alert("Error updating: " + error.message);
    else {
      alert("Stats updated successfully!");
      fetchTeams();
    }
  };

  const handleAddTeam = async () => {
    if (teams.length >= 16) return alert("Tournament full!");
    if (!newTeamName.trim()) return alert("Enter a team name");

    const { error } = await supabase.from("teams").insert([
      {
        name: newTeamName,
        w: 0,
        l: 0,
        d: 0,
        group_id: parseInt(newTeamGroup),
      },
    ]);

    if (error) alert("Add error: " + error.message);
    else {
      setNewTeamName("");
      fetchTeams();
    }
  };

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Delete ${name} and ALL its matches?`)) return;

    try {
      await supabase
        .from("matches")
        .delete()
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`);

      const { error: teamError } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);

      if (teamError) throw teamError;

      alert(`${name} deleted`);
      fetchTeams();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const groups = {};
  teams.forEach((team) => {
    if (!groups[team.group_id]) groups[team.group_id] = [];
    groups[team.group_id].push(team);
  });

  if (loading) return <div className="container p-5 text-center">Loading...</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Tournament Control Panel</h2>
        <span className="badge bg-secondary">
          Teams: {teams.length} / 16
        </span>
      </div>

      {/* Add Team - Horizontal Bar */}
      <div className="card mb-5 shadow-sm">
        <div className="card-body">
          <h5 className="card-title small fw-bold text-uppercase mb-3">Add New Team</h5>
          <div className="row g-2">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Team Name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={teams.length >= 16}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={newTeamGroup}
                onChange={(e) => setNewTeamGroup(e.target.value)}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>Group {n}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-dark w-100"
                onClick={handleAddTeam}
                disabled={teams.length >= 16}
              >
                {teams.length >= 16 ? "Full" : "Add Team"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Groups Display */}
      <div className="row">
        {Object.keys(groups).sort().map((groupId) => (
          <div key={groupId} className="col-lg-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h6 className="mb-0 fw-bold">GROUP {groupId}</h6>
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
                              className="form-control form-control-sm text-center px-1"
                              value={team[f]}
                              onChange={(e) => handleChange(team.id, f, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-secondary" onClick={() => handleSave(team)}>
                              Save
                            </button>
                            <button className="btn btn-outline-danger" onClick={() => handleDeleteTeam(team.id, team.name)}>
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
          <p>No teams registered yet.</p>
        </div>
      )}
    </div>
  );
}

export default TeamsManager;