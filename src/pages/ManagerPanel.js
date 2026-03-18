import React, { useEffect, useState, useRef, useCallback } from "react"; // Added useCallback
import { supabase } from "../supabase";
import { getActiveTournament } from "../Utils/TournamentSession";

function TeamsManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamGroup, setNewTeamGroup] = useState("0");

  const nameInputRef = useRef(null);

  const activeSession = getActiveTournament();

  useEffect(() => {
    async function fetchTournaments() {
      setLoading(true);
      let query = supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

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
      if (data?.length > 0) {
        if (activeSession?.id && data.some((t) => t.id === activeSession.id)) {
          setSelectedTournamentId(activeSession.id);
        } else {
          setSelectedTournamentId(data[0].id);
        }
      }
      setLoading(false);
    }
    fetchTournaments();
    // Added activeSession?.id to dependencies to satisfy ESLint
  }, [activeSession?.id]);

  // Wrapped in useCallback so it can be safely used in useEffect dependencies
  const refreshTeams = useCallback(async () => {
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
  }, [selectedTournamentId]);

  useEffect(() => {
    if (selectedTournamentId) refreshTeams();
  }, [selectedTournamentId, refreshTeams]); // Added refreshTeams here

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

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !selectedTournamentId) return;
    const { error } = await supabase.from("teams").insert({
      name: newTeamName.trim(),
      tournament_id: selectedTournamentId,
      group_id: parseInt(newTeamGroup) || 0,
      w: 0,
      l: 0,
      d: 0,
    });

    if (!error) {
      setNewTeamName("");
      refreshTeams();
      nameInputRef.current?.focus();
    } else {
      alert(error.message);
    }
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

  const isLockedMode = !!activeSession?.id;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">
          {isLockedMode ? `Managing: ${activeSession?.name}` : "Tournaments"}
        </h2>
        {!isLockedMode && (
          <select
            className="form-select w-auto"
            value={selectedTournamentId ?? ""}
            onChange={(e) =>
              setSelectedTournamentId(
                e.target.value ? Number(e.target.value) : null
              )
            }
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

      {loading && teams.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : !selectedTournamentId ? (
        <div className="text-center py-5 bg-light rounded">
          <p className="text-muted">Select a tournament to manage teams.</p>
        </div>
      ) : (
        <>
          <div className="card mb-4 shadow-sm border-0 bg-dark text-white">
            <div className="card-body">
              <h6 className="mb-3">Add Team</h6>
              <div className="row g-2">
                <div className="col-md-6">
                  <input
                    ref={nameInputRef}
                    type="text"
                    className="form-control"
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTeam()}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={newTeamGroup}
                    onChange={(e) => setNewTeamGroup(e.target.value)}
                  >
                    <option value="0">No Group </option>
                    <option value="1">Group 1</option>
                    <option value="2">Group 2</option>
                    <option value="3">Group 3</option>
                    <option value="4">Group 4</option>
                  </select>
                </div>
                <div className="col-md-3">
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

          <div className="row">
            {Object.keys(groups)
              .sort((a, b) => (a === "0" ? 1 : b === "0" ? -1 : a - b))
              .map((groupId) => (
                <div key={groupId} className="col-lg-4 col-md-6 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white fw-bold text-primary">
                      {groupId === "0" ? "Teams" : `Group ${groupId}`}
                    </div>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr className="small text-muted">
                            <th>Team</th>
                            <th>W</th>
                            <th>L</th>
                            <th>D</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {groups[groupId].map((team) => (
                            <tr key={team.id}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm fw-bold"
                                  value={team.name}
                                  onChange={(e) =>
                                    handleChange(team.id, "name", e.target.value)
                                  }
                                />
                              </td>
                              {["w", "l", "d"].map((f) => (
                                <td key={f}>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-center"
                                    style={{ width: "45px" }}
                                    value={team[f] ?? 0}
                                    onChange={(e) =>
                                      handleChange(team.id, f, e.target.value)
                                    }
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
                                  onClick={() =>
                                    handleDeleteTeam(team.id, team.name)
                                  }
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
        </>
      )}
    </div>
  );
}

export default TeamsManager;