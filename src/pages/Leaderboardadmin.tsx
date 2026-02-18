import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase";

interface Props {
  onSuccess: () => void;
}

const LeaderboardForm: React.FC<Props> = ({ onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [, setLoadingTeams] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const initialForm = {
    username: "",
    tournaments_played: 1,
    w: 0, d: 0, l: 0,
    goals: 0, against: 0,
  };

  const [formData, setFormData] = useState(initialForm);

  const notify = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true);
    const { data, error } = await supabase
      .from("tournament_stats")
      .select("*")
      .order("username", { ascending: true });
    if (!error) setTeams(data || []);
    setLoadingTeams(false);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

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
        w: team.w, d: team.d, l: team.l,
        goals: team.goals, against: team.against,
      });
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setFormData(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = selectedId 
        ? await supabase.from("tournament_stats").update(formData).eq("id", selectedId)
        : await supabase.from("tournament_stats").insert([formData]);

      if (error) throw error;

      notify("success", selectedId ? "Stats updated!" : "Team saved!");
      if (!selectedId) resetForm();
      fetchTeams();
      onSuccess();
    } catch (err: any) {
      notify("danger", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Navbar /> 
      
      {/* Container-fluid with px-0 ensures absolute 100% width edge-to-edge */}
      <div className="container-fluid px-0 " style={{ marginTop: '75px' }}>
        <div className="card border-0 shadow-sm rounded-0" style={{ width: '100%' }}>
          <div className="card-header bg-dark text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                {selectedId ? `Editing: ${formData.username}` : "Manage Leaderboard"}
              </h5>
              {selectedId && (
                <button className="btn btn-sm btn-outline-light" onClick={resetForm}>
                  Add New Instead
                </button>
              )}
            </div>
          </div>

          <div className="card-body p-4">
            {message && (
              <div className={`alert alert-${message.type} py-2 mb-4 text-center animate__animated animate__fadeIn`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Top Row: Select and Name */}
                <div className="col-12 col-lg-4">
                  <label className="small fw-bold text-muted mb-2 text-uppercase">Existing Teams</label>
                  <select className="form-select form-select-lg border-2" onChange={handleTeamSelect} value={selectedId || ""}>
                    <option value="">-- Create New Entry --</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.username}</option>)}
                  </select>
                </div>

                <div className="col-12 col-lg-5">
                  <label className="small fw-bold text-muted mb-2 text-uppercase">Team/User Name</label>
                  <input type="text" className="form-control form-control-lg border-2" value={formData.username} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                </div>

                <div className="col-12 col-lg-3">
                  <label className="small fw-bold text-muted mb-2 text-uppercase">Played</label>
                  <input type="number" className="form-control form-control-lg border-2" value={formData.tournaments_played} 
                    onChange={(e) => setFormData({...formData, tournaments_played: Number(e.target.value)})} />
                </div>

                {/* Stats Row */}
                <div className="col-12">
                  <div className="row g-2 text-center">
                    <div className="col">
                      <div className="p-3 bg-light rounded-3 border">
                        <label className="d-block small fw-bold text-success">WINS</label>
                        <input type="number" className="form-control form-control-plaintext text-center fw-bold fs-4" value={formData.w} 
                          onChange={(e) => setFormData({...formData, w: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-3 bg-light rounded-3 border">
                        <label className="d-block small fw-bold text-secondary">DRAWS</label>
                        <input type="number" className="form-control form-control-plaintext text-center fw-bold fs-4" value={formData.d} 
                          onChange={(e) => setFormData({...formData, d: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-3 bg-light rounded-3 border">
                        <label className="d-block small fw-bold text-danger">LOSSES</label>
                        <input type="number" className="form-control form-control-plaintext text-center fw-bold fs-4" value={formData.l} 
                          onChange={(e) => setFormData({...formData, l: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-3 bg-light rounded-3 border">
                        <label className="d-block small fw-bold text-dark">GF</label>
                        <input type="number" className="form-control form-control-plaintext text-center fw-bold fs-4" value={formData.goals} 
                          onChange={(e) => setFormData({...formData, goals: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="col">
                      <div className="p-3 bg-light rounded-3 border">
                        <label className="d-block small fw-bold text-dark">GA</label>
                        <input type="number" className="form-control form-control-plaintext text-center fw-bold fs-4" value={formData.against} 
                          onChange={(e) => setFormData({...formData, against: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <button type="submit" className={`btn btn-lg w-100 fw-bold py-3 ${selectedId ? 'btn-success' : 'btn-primary'}`} disabled={submitting}>
                    {submitting ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : selectedId ? "UPDATE LEADERBOARD" : "SAVE TO LEADERBOARD"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardForm;