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

  // Load existing teams for the dropdown
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
      // UPDATE existing team
      const { error: err } = await supabase
        .from("tournament_stats")
        .update(formData)
        .eq("id", selectedId);
      error = err;
    } else {
      // INSERT new team
      const { error: err } = await supabase
        .from("tournament_stats")
        .insert([formData]);
      error = err;
    }

    if (error) {
      setMessage({ type: "danger", text: error.message });
    } else {
      setMessage({ type: "success", text: selectedId ? "Team updated!" : "Team added!" });
      if (!selectedId) resetForm();
      fetchTeams();
      onSuccess();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedId || !window.confirm("Are you sure you want to delete this team?")) return;
    
    setSubmitting(true);
    const { error } = await supabase.from("tournament_stats").delete().eq("id", selectedId);
    
    if (error) {
      setMessage({ type: "danger", text: error.message });
    } else {
      setMessage({ type: "warning", text: "Team deleted successfully." });
      resetForm();
      fetchTeams();
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <>
      <Navbar />
      <div className="card shadow-sm border-0" style={{ marginTop: "75px" }}>
        <div className="card-header bg-dark py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-white text-uppercase" >
            {selectedId ? "📝 Edit Team" : "➕ Add New Team"}
          </h5>
          {selectedId && (
            <button className="btn btn-sm btn-outline-light" onClick={resetForm}>
              Create New Instead
            </button>
          )}
        </div>
        
        <div className="card-body bg-light">
          {/* TEAM SELECTOR */}
          <div className="mb-4 p-3 bg-white rounded border">
            <label className="form-label small fw-bold text-primary">Quick Select Team to Update</label>
            <select 
              className="form-select" 
              onChange={handleTeamSelect} 
              value={selectedId || ""}
              disabled={loadingTeams}
            >
              <option value="">-- Create New Team --</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.username}</option>
              ))}
            </select>
          </div>

          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Team Name</label>
                <input
                  type="text"
                  name="username"
                  className="form-control form-control-lg"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. SkylaFC"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">Tournaments</label>
                <input
                  type="number"
                  name="tournaments_played"
                  className="form-control form-control-lg"
                  value={formData.tournaments_played}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>

              <div className="col-4 col-md-1">
                <label className="form-label small text-muted">W</label>
                <input type="number" name="w" className="form-control" value={formData.w} onChange={handleInputChange} />
              </div>
              <div className="col-4 col-md-1">
                <label className="form-label small text-muted">D</label>
                <input type="number" name="d" className="form-control" value={formData.d} onChange={handleInputChange} />
              </div>
              <div className="col-4 col-md-1">
                <label className="form-label small text-muted">L</label>
                <input type="number" name="l" className="form-control" value={formData.l} onChange={handleInputChange} />
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small text-muted">Goals For (GF)</label>
                <input type="number" name="goals" className="form-control" value={formData.goals} onChange={handleInputChange} />
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small text-muted">Goals Against (GA)</label>
                <input type="number" name="against" className="form-control" value={formData.against} onChange={handleInputChange} />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                type="submit"
                className={`btn ${selectedId ? 'btn-success' : 'btn-primary'} flex-grow-1 py-2 fw-bold`}
                disabled={submitting}
              >
                {submitting ? "Processing..." : selectedId ? "Update Team Stats" : "Save New Team"}
              </button>
              
              {selectedId && (
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LeaderboardForm;