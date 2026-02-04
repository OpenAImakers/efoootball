import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase";

interface Props {
  onSuccess: () => void;
}

const LeaderboardForm: React.FC<Props> = ({ onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const initialForm = {
    username: "",
    tournaments_played: 1,
    w: 0,
    d: 0,
    l: 0,
    goals: 0,
    against: 0,
  };

  const [formData, setFormData] = useState(initialForm);

  // Load existing teams for dropdown
  const fetchTeams = async () => {
    setLoadingTeams(true);
    const { data, error } = await supabase
      .from("tournament_stats")
      .select("*")
      .order("username", { ascending: true });
    if (!error) setTeams(data || []);
    setLoadingTeams(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleTeamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      resetForm();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "username" ? value : Number(value) || 0,
    }));
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData(initialForm);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let error;
    if (selectedId) {
      // UPDATE
      const { error: err } = await supabase
        .from("tournament_stats")
        .update(formData)
        .eq("id", selectedId);
      error = err;
    } else {
      // INSERT
      const { error: err } = await supabase
        .from("tournament_stats")
        .insert([formData]);
      error = err;
    }

    if (error) {
      setMessage({ type: "danger", text: error.message });
    } else {
      setMessage({ type: "success", text: selectedId ? "Team updated successfully!" : "New team added!" });
      if (!selectedId) resetForm();
      fetchTeams();
      onSuccess();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedId || !window.confirm("Delete this team permanently?")) return;

    setSubmitting(true);
    const { error } = await supabase.from("tournament_stats").delete().eq("id", selectedId);

    if (error) {
      setMessage({ type: "danger", text: error.message });
    } else {
      setMessage({ type: "warning", text: "Team deleted." });
      resetForm();
      fetchTeams();
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <>
      <Navbar />

      <div className="container-fluid mt-5 py-5">
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="card-header bg-gradient-primary py-4">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold">
                <i className="bi bi-trophy-fill me-2"></i>
                {selectedId ? "Edit Team Stats" : "Add New Team to Leaderboard"}
              </h4>
              {selectedId && (
                <button className="btn btn-sm btn-light" onClick={resetForm}>
                  <i className="bi bi-plus-circle me-1"></i> New Team
                </button>
              )}
            </div>
          </div>

          <div className="card-body p-4 p-md-5 bg-white">
            {/* Message Alert */}
            {message && (
              <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} role="alert">
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
              </div>
            )}

            {/* Team Quick Select */}
            <div className="mb-5">
              <label className="form-label fw-semibold text-primary">Quick Select Existing Team</label>
              <select
                className="form-select form-select-lg shadow-sm"
                onChange={handleTeamSelect}
                value={selectedId || ""}
                disabled={loadingTeams || submitting}
              >
                <option value="">-- Create New Team --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.username} ({team.w || 0}W - {team.d || 0}D - {team.l || 0}L)
                  </option>
                ))}
              </select>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Team Name */}
                <div className="col-12 col-md-8">
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      name="username"
                      className="form-control form-control-lg"
                      id="username"
                      placeholder="Team Name"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                    <label htmlFor="username">Team Name</label>
                  </div>
                </div>

                {/* Tournaments Played */}
                <div className="col-12 col-md-4">
                  <div className="form-floating mb-3">
                    <input
                      type="number"
                      name="tournaments_played"
                      className="form-control form-control-lg"
                      id="tournaments_played"
                      placeholder="Tournaments"
                      value={formData.tournaments_played}
                      onChange={handleInputChange}
                      min="1"
                    />
                    <label htmlFor="tournaments_played">Tournaments Played</label>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="col-12">
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="form-floating">
                        <input
                          type="number"
                          name="w"
                          className="form-control"
                          id="w"
                          placeholder="Wins"
                          value={formData.w}
                          onChange={handleInputChange}
                          min="0"
                        />
                        <label htmlFor="w">Wins (W)</label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-floating">
                        <input
                          type="number"
                          name="d"
                          className="form-control"
                          id="d"
                          placeholder="Draws"
                          value={formData.d}
                          onChange={handleInputChange}
                          min="0"
                        />
                        <label htmlFor="d">Draws (D)</label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-floating">
                        <input
                          type="number"
                          name="l"
                          className="form-control"
                          id="l"
                          placeholder="Losses"
                          value={formData.l}
                          onChange={handleInputChange}
                          min="0"
                        />
                        <label htmlFor="l">Losses (L)</label>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="form-floating">
                        <input
                          type="number"
                          name="goals"
                          className="form-control"
                          id="goals"
                          placeholder="GF"
                          value={formData.goals}
                          onChange={handleInputChange}
                          min="0"
                        />
                        <label htmlFor="goals">Goals For (GF)</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goals Against */}
                <div className="col-12 col-md-6">
                  <div className="form-floating">
                    <input
                      type="number"
                      name="against"
                      className="form-control"
                      id="against"
                      placeholder="GA"
                      value={formData.against}
                      onChange={handleInputChange}
                      min="0"
                    />
                    <label htmlFor="against">Goals Against (GA)</label>
                  </div>
                </div>

                {/* Submit & Delete */}
                <div className="col-12 mt-4">
                  <div className="d-flex gap-3 flex-wrap">
                    <button
                      type="submit"
                      className={`btn btn-lg flex-grow-1 fw-bold py-3 ${selectedId ? "btn-success" : "btn-primary"}`}
                      disabled={submitting || loadingTeams}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : selectedId ? (
                        "Update Team Stats"
                      ) : (
                        "Save New Team"
                      )}
                    </button>

                    {selectedId && (
                      <button
                        type="button"
                        className="btn btn-lg btn-outline-danger px-5"
                        onClick={handleDelete}
                        disabled={submitting || loadingTeams}
                      >
                        Delete Team
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaderboardForm;