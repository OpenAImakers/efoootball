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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Pull session info for Exit/Header purposes
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

  const notify = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Logic to clear session and redirect
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
    } catch (err: any) {
      console.error("Failed to load teams:", err);
      notify("danger", "Could not load existing teams");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleTeamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setSelectedId(null);
      setFormData(initialForm);
      return;
    }

    const team = teams.find((t) => t.id.toString() === id);
    if (team) {
      setSelectedId(id);
      setFormData({
        username: team.username,
        tournaments_played: team.tournaments_played,
        w: team.w,
        d: team.d,
        l: team.l,
        goals: team.goals,
        against: team.against,
      });
    }
  };

  const handleNumberChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: val === "" ? 0 : Number(val),
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

      notify("success", selectedId ? "Stats updated!" : "Added successfully!");
      
      if (!selectedId) {
        setFormData(initialForm);
        setSelectedId(null);
      }
      
      fetchTeams();
    } catch (err: any) {
      notify("danger", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <Navbar />

      {/* SESSION HEADER - Integrated for Exit purposes */}
      <div className="bg-dark text-white py-2 px-4 d-flex justify-content-between align-items-center shadow-sm" style={{ marginTop: '70px' }}>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary">ACTIVE SESSION</span>
          <span className="fw-bold">{activeSession?.name || "Leaderboard Admin"}</span>
        </div>
        <button onClick={handleExitLeaderboard} className="btn btn-sm btn-outline-danger" style={{ fontWeight: 600 }}>
          Exit Leaderboard
        </button>
      </div>

      <div className="container-fluid px-0">
        <div className="card border-0 shadow-sm rounded-0">
          <div className="card-header bg-secondary text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                {selectedId ? `Editing: ${formData.username}` : "Manage Leaderboard"}
              </h5>
              {selectedId && (
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => {
                    setSelectedId(null);
                    setFormData(initialForm);
                  }}
                >
                  Add New Instead
                </button>
              )}
            </div>
          </div>

          <div className="card-body p-4">
            {message && (
              <div className={`alert alert-${message.type} py-2 mb-4 text-center`}>
                {message.text}
              </div>
            )}

            {loadingTeams ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">Loading global stats...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  <div className="col-12 col-lg-4">
                    <label className="small fw-bold text-muted mb-2 text-uppercase">Existing Teams</label>
                    <select
                      className="form-select form-select-lg border-2"
                      onChange={handleTeamSelect}
                      value={selectedId || ""}
                      disabled={submitting}
                    >
                      <option value="">-- Create New Entry --</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.username}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-lg-5">
                    <label className="small fw-bold text-muted mb-2 text-uppercase">Team Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg border-2"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="small fw-bold text-muted mb-2 text-uppercase">Tournaments Played</label>
                    <input
                      type="number"
                      className="form-control form-control-lg border-2"
                      value={formData.tournaments_played}
                      onChange={handleNumberChange("tournaments_played")}
                      disabled={submitting}
                    />
                  </div>

                  <div className="col-12">
                    <div className="row g-3 text-center">
                      {[
                        { key: "w", label: "WINS", color: "success" },
                        { key: "d", label: "DRAWS", color: "secondary" },
                        { key: "l", label: "LOSSES", color: "danger" },
                        { key: "goals", label: "GF", color: "dark" },
                        { key: "against", label: "GA", color: "dark" },
                      ].map(({ key, label, color }) => (
                        <div className="col" key={key}>
                          <div className="p-3 bg-light rounded-3 border">
                            <label className={`d-block small fw-bold text-${color}`}>{label}</label>
                            <input
                              type="number"
                              className="form-control form-control-plaintext text-center fw-bold fs-4"
                              value={formData[key as keyof typeof formData]}
                              onChange={handleNumberChange(key as keyof typeof formData)}
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className={`btn btn-lg w-100 fw-bold py-3 ${selectedId ? "btn-success" : "btn-primary"}`}
                      disabled={submitting}
                    >
                      {submitting ? "PROCESSING..." : selectedId ? "UPDATE LEADERBOARD" : "SAVE TO LEADERBOARD"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardForm;