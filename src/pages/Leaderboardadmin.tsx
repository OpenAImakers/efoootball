import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase";
import { getActiveLeaderboard } from "../Utils/LeaderboardSession";

interface Team {
  id: string | number;
  username: string;
  tournaments_played: number;
  w: number;
  d: number;
  l: number;
  goals: number;
  against: number;
}

const LeaderboardForm: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "danger" | "warning"; text: string } | null>(null);

  const activeSession = getActiveLeaderboard();

  const initialForm: Omit<Team, "id"> = {
    username: "",
    tournaments_played: 1,
    w: 0,
    d: 0,
    l: 0,
    goals: 0,
    against: 0,
  };

  const [formData, setFormData] = useState(initialForm);

  const notify = (type: "success" | "danger" | "warning", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExitLeaderboard = () => {
    localStorage.removeItem("active_leaderboard");
    window.location.href = "/admin";
  };

  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const { data, error } = await supabase
        .from("tournament_stats")
        .select("*")
        .order("username", { ascending: true });

      if (error) throw error;
      setTeams(data || []);
      setFilteredTeams(data || []);
    } catch (err: any) {
      console.error("Failed to load teams:", err);
      notify("danger", "Could not load teams");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredTeams(teams);
      return;
    }
    const filtered = teams.filter((t) =>
      t.username.toLowerCase().includes(term)
    );
    setFilteredTeams(filtered);
  }, [searchTerm, teams]);

  const handleSelectTeam = (team: Team) => {
    setSelectedId(team.id.toString());
    setFormData({
      username: team.username,
      tournaments_played: team.tournaments_played,
      w: team.w,
      d: team.d,
      l: team.l,
      goals: team.goals,
      against: team.against,
    });
  };

  const handleDeleteTeam = async (id: string | number) => {
    if (!window.confirm("Delete this team permanently?")) return;

    try {
      const { error } = await supabase.from("tournament_stats").delete().eq("id", id);
      if (error) throw error;

      notify("success", "Team deleted successfully");
      fetchTeams();
      if (selectedId === id.toString()) {
        setSelectedId(null);
        setFormData(initialForm);
      }
    } catch (err: any) {
      notify("danger", "Failed to delete team");
    }
  };

  const handleNumberChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: val === "" ? 0 : Math.max(0, Number(val)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      notify("warning", "Team name is required");
      return;
    }

    setSubmitting(true);
    try {
      let error: any = null;

      if (selectedId) {
        ({ error } = await supabase
          .from("tournament_stats")
          .update(formData)
          .eq("id", selectedId));
      } else {
        ({ error } = await supabase.from("tournament_stats").insert([formData]));
      }

      if (error) throw error;

      notify("success", selectedId ? "Team updated!" : "Team added!");
      if (!selectedId) setFormData(initialForm);
      setSelectedId(null);
      fetchTeams();
    } catch (err: any) {
      notify("danger", err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const goalDifference = formData.goals - formData.against;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <Navbar />

      {/* Session Banner */}
      <div
        className="bg-gradient-dark text-white py-3 px-4 shadow"
        style={{ marginTop: "70px", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-white text-primary fw-bold px-3 py-2">ACTIVE</span>
            <h6 className="mb-0 fw-bold">{activeSession?.name || "Leaderboard Admin"}</h6>
          </div>
          <button onClick={handleExitLeaderboard} className="btn btn-sm btn-outline-light fw-semibold px-3">
            Exit
          </button>
        </div>
      </div>

      <div className="container-fluid py-4 flex-grow-1">
        <div className="row g-4 h-100">
          {/* LEFT: Teams Sidebar - Scrollable */}
          <div className="col-lg-5 col-xl-4 h-100">
            <div className="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column">
              <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">Teams ({filteredTeams.length})</h5>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setSelectedId(null);
                    setFormData(initialForm);
                  }}
                >
                  + New
                </button>
              </div>

              <div className="p-3 border-bottom">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by team name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-grow-1 overflow-hidden position-relative">
                {loadingTeams ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-3 text-muted">Loading teams...</p>
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No teams found {searchTerm && `(for "${searchTerm}")`}
                  </div>
                ) : (
                  <div
                    className="table-responsive h-100"
                    style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }} // Adjust 220px based on your navbar+header+search+padding
                  >
                    <table className="table table-hover table-borderless mb-0">
                      <thead className="sticky-top bg-light border-bottom shadow-sm small">
                        <tr>
                          <th className="ps-4 py-3">Team Name</th>
                          <th className="text-center py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeams.map((team) => (
                          <tr
                            key={team.id}
                            className={`align-middle ${selectedId === team.id.toString() ? "table-primary" : ""}`}
                            onClick={() => handleSelectTeam(team)}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="ps-4 py-3 fw-medium">{team.username}</td>
                            <td className="text-center py-3">
                              <button
                                className="btn btn-sm btn-outline-secondary me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTeam(team);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTeam(team.id);
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Form - takes remaining space */}
          <div className="col-lg-7 col-xl-8 h-100">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white py-4 border-0">
                <h4 className="mb-0 fw-bold">
                  {selectedId ? `Editing: ${formData.username}` : "Add New Team"}
                </h4>
              </div>

              <div className="card-body p-4 p-lg-5 overflow-auto">
                {message && (
                  <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage(null)} />
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* ... rest of the form remains the same as previous version ... */}
                  <div className="row g-4">
                    <div className="col-12">
                      <label className="form-label fw-semibold text-uppercase small text-muted mb-2">
                        Team Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="e.g. Harambee Stars"
                        required
                        disabled={submitting}
                        autoFocus
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold text-uppercase small text-muted mb-3">
                        Statistics
                      </label>
                      <div className="row g-3">
                        {/* Tournaments, W, D, L, GF, GA, GD cards - same as before */}
                        <div className="col-6 col-md-3">
                          <div className="p-3 bg-light rounded border text-center">
                            <label className="d-block small fw-bold text-primary mb-1">Tournaments</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control text-center fw-bold fs-4 border-0 bg-transparent"
                              value={formData.tournaments_played}
                              onChange={handleNumberChange("tournaments_played")}
                              disabled={submitting}
                            />
                          </div>
                        </div>

                        {[
                          { key: "w", label: "W", color: "success" },
                          { key: "d", label: "D", color: "warning" },
                          { key: "l", label: "L", color: "danger" },
                          { key: "goals", label: "GF", color: "dark" },
                          { key: "against", label: "GA", color: "dark" },
                        ].map(({ key, label, color }) => (
                          <div className="col-6 col-md-3" key={key}>
                            <div className="p-3 bg-light rounded border text-center">
                              <label className={`d-block small fw-bold text-${color} mb-1`}>{label}</label>
                              <input
                                type="number"
                                min="0"
                                className="form-control text-center fw-bold fs-4 border-0 bg-transparent"
                                value={formData[key as keyof typeof formData]}
                                onChange={handleNumberChange(key as keyof typeof formData)}
                                disabled={submitting}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="col-6 col-md-3">
                          <div className={`p-3 rounded border text-center ${goalDifference >= 0 ? "bg-success-subtle border-success" : "bg-danger-subtle border-danger"}`}>
                            <label className="d-block small fw-bold mb-1">GD</label>
                            <div className="fw-bold fs-3">
                              {goalDifference >= 0 ? "+" : ""}{goalDifference}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 mt-5">
                      <div className="d-flex gap-3 flex-column flex-sm-row">
                        <button
                          type="submit"
                          className={`btn btn-lg fw-bold flex-grow-1 py-3 shadow ${selectedId ? "btn-success" : "btn-primary"}`}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                              Saving...
                            </>
                          ) : selectedId ? (
                            "Update Team"
                          ) : (
                            "Add Team"
                          )}
                        </button>

                        {selectedId && (
                          <button
                            type="button"
                            className="btn btn-lg btn-outline-secondary fw-bold px-5"
                            onClick={() => {
                              setSelectedId(null);
                              setFormData(initialForm);
                            }}
                            disabled={submitting}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardForm;