import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getActiveTournament } from "../Utils/TournamentSession";

function TeamsManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamGroup, setNewTeamGroup] = useState("1");

  const activeSession = getActiveTournament(); // null or { id: number, name: string }

  // 1. Fetch tournaments — respect active session if present
  useEffect(() => {
    async function fetchTournaments() {
      setLoading(true);

      let query = supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

      // If there's an active session → only load that tournament
      if (activeSession?.id) {
        query = query.eq("id", activeSession.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tournaments:", error);
        setLoading(false);
        return;
      }

      setTournaments(data || []);

      // Auto-select logic
      if (data?.length > 0) {
        // Prefer the session one if it matches
        if (activeSession?.id && data.some(t => t.id === activeSession.id)) {
          setSelectedTournamentId(activeSession.id);
        } else {
          setSelectedTournamentId(data[0].id);
        }
      }

      setLoading(false);
    }

    fetchTournaments();
  }, []); // runs once on mount

  // 2. Refresh teams when tournament changes
  const refreshTeams = async () => {
    if (!selectedTournamentId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", selectedTournamentId)
      .order("group_id", { ascending: true })
      .order("name", { ascending: true });

    if (!error) setTeams(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTournamentId) refreshTeams();
  }, [selectedTournamentId]);

  // Handlers (unchanged)
  const handleChange = (id, field, value) => {
    setTeams((prev) =>
      prev.map((team) => (team.id === id ? { ...team, [field]: value } : team))
    );
  };

  const handleSave = async (team) => {
    if (!window.confirm(`Save stats for ${team.name}?`)) return;
    const { error } = await supabase
      .from("teams")
      .update({ w: parseInt(team.w), l: parseInt(team.l), d: parseInt(team.d) })
      .eq("id", team.id);
    if (error) alert(error.message);
    else refreshTeams();
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !selectedTournamentId) return;
    const { error } = await supabase.from("teams").insert({
      name: newTeamName.trim(),
      tournament_id: selectedTournamentId,
      group_id: parseInt(newTeamGroup),
      w: 0, l: 0, d: 0,
    });
    if (!error) {
      setNewTeamName("");
      refreshTeams();
    } else {
      alert(error.message);
    }
  };

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    // Optional: clean up related matches
    await supabase.from("matches").delete().or(`home_team_id.eq.${id},away_team_id.eq.${id}`);
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (!error) refreshTeams();
  };

  // Group teams
  const groups = {};
  teams.forEach((team) => {
    const gid = team.group_id || "Ungrouped";
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(team);
  });

  const isLockedMode = !!activeSession?.id;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">
          {isLockedMode
            ? `Managing: ${activeSession?.name || "Tournament"}`
            : "Tournaments"}
        </h2>

        {!isLockedMode && (
          <select
            className="form-select w-auto"
            value={selectedTournamentId ?? ""}
            onChange={(e) => setSelectedTournamentId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a Tournament</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : !selectedTournamentId ? (
        <div className="text-center py-5 bg-light rounded">
          <p className="text-muted">Select a tournament to manage teams.</p>
        </div>
      ) : (
        <>
          {/* Add Team Form */}
          <div className="card mb-4 shadow-sm border-0 bg-dark text-white">
            <div className="card-body">
              <h6 className="mb-3">Add Team</h6>
              <div className="row g-2">
                <div className="col-8">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleAddTeam}
                    disabled={!newTeamName.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Teams by Group */}
          <div className="row">
            {Object.keys(groups)
              .sort((a, b) => (a === "Ungrouped" ? 1 : a.localeCompare(b)))
              .map((groupId) => (
                <div key={groupId} className="col-md-6 mb-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white fw-bold">
                      Group {groupId === "Ungrouped" ? "Other" : groupId}
                    </div>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr className="small text-muted">
                            <th>Team</th>
                            <th>W</th>
                            <th>L</th>
                            <th>D</th>
                            <th className="text-end">Action</th>
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
                                    className="form-control form-control-sm px-1 text-center"
                                    style={{ width: "45px" }}
                                    value={team[f] ?? 0}
                                    onChange={(e) => handleChange(team.id, f, e.target.value)}
                                  />
                                </td>
                              ))}
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-link text-success p-0 me-2"
                                  onClick={() => handleSave(team)}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => handleDeleteTeam(team.id, team.name)}
                                >
                                  Del
                                </button>
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

          <hr
            style={{
              border: "none",
              height: "4px",
              backgroundColor: "#111",
              margin: "30px 0",
              borderRadius: "4px",
            }}
          />
        </>
      )}
    </div>
  );
}

export default TeamsManager;