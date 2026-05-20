"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function SpecificRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reg, setReg] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ team_name: "", username: "", whatsapp: "+254" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Clean label formatting for database string fields
  const getTournamentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      single_elimination: "Single Elimination",
      round_robin_single: "Round Robin (Single)",
      round_robin_double: "Round Robin (Double)",
      double_elimination: "Double Elimination",
    };
    return types[type] || type?.replace(/_/g, " ") || "Custom Tournament";
  };

  // Fetch registration, user, and teams
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Get current user
      const { data: { user: userData } } = await supabase.auth.getUser();
      setUser(userData || null);

      // Get registration details
      const { data: regData } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", id)
        .single();
      
      if (!regData) {
        setLoading(false);
        return;
      }
      setReg(regData);

      // Get registered teams
      const { data: teamsData } = await supabase
        .from("tournament_registrations")
        .select("*")
        .eq("registration_id", id)
        .order("created_at", { ascending: true });
      
      setTeams(teamsData || []);
      
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if current user is already registered
  const userReg = teams.find(team => team.user_id === user?.id);
  const isFull = teams.length >= (reg?.max_players || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reg) return;
    
    setSubmitting(true);
    setMessage(null);

    // Check if full
    if (teams.length >= reg.max_players) {
      setMessage({ type: "danger", text: `${reg.name} is full! Max ${reg.max_players} teams.` });
      setSubmitting(false);
      return;
    }

    // Check if user already registered
    if (user && userReg) {
      setMessage({ type: "danger", text: `You're already registered for ${reg.name}!` });
      setSubmitting(false);
      return;
    }

    try {
      const { data: inserted, error } = await supabase
        .from("tournament_registrations")
        .insert([
          {
            team_name: formData.team_name,
            username: formData.username,
            whatsapp: formData.whatsapp,
            registration_id: reg.id,
            user_id: user?.id || null,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: "success", text: "Registration Successful!" });
      setTeams([inserted, ...teams]);
      setFormData({ team_name: "", username: "", whatsapp: "+254" });
      
      // Auto refresh after 2 seconds
      setTimeout(() => {
        fetchData();
      }, 2000);
      
    } catch (err: any) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!reg) {
    return (
      <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
        <Navbar />
        <div className="container py-5 text-center">
          <h3>Tournament not found</h3>
          <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
      <Navbar />

      <div className="container py-4">
        {/* Tournament Name Header */}
        <div className="mb-4">
          <h2 className="fw-bold text-primary mb-1">{reg.name}</h2>
          {reg.tournament_type && (
            <div className="mb-2">
              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold px-2.5 py-1.5 rounded-2">
                Format: {getTournamentTypeLabel(reg.tournament_type)}
              </span>
            </div>
          )}
          <p className="text-muted small mb-0">Register for this tournament</p>
        </div>

        {/* Two Column Layout */}
        <div className="row g-4">
          {/* Form Column */}
          <div className="col-12 col-lg-6">
            <div className="bg-light rounded-4 p-4 h-100">
              <h5 className="fw-bold text-primary mb-3">
                {userReg ? "Your Registration" : "Join Tournament"}
              </h5>

              {message && (
                <div className={`alert alert-${message.type} fw-bold small mb-3`}>
                  {message.text}
                </div>
              )}

              {userReg ? (
                <div className="text-center py-4">
                  <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                    <span className="display-4">✓</span>
                  </div>
                  <h6 className="fw-bold mb-2">{userReg.team_name}</h6>
                  <p className="text-muted small mb-2">@{userReg.username}</p>
                  <span className="badge bg-success px-3 py-2">
                    {userReg.status.toUpperCase()}
                  </span>
                </div>
              ) : isFull ? (
                <div className="text-center py-4">
                  <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                    <span className="display-4">⚠️</span>
                  </div>
                  <h6 className="fw-bold">Tournament Full</h6>
                  <p className="text-muted small mb-0">
                    Maximum of {reg.max_players} teams reached
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      TEAM NAME
                    </label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      placeholder="Enter your team name"
                      value={formData.team_name}
                      onChange={(e) =>
                        setFormData({ ...formData, team_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      USERNAME
                    </label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-secondary">
                      WHATSAPP CONTACT
                    </label>
                    <input
                      type="tel"
                      className="form-control border-0 shadow-sm"
                      placeholder="+254 700 000000"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 fw-bold py-2"
                    disabled={submitting}
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none"
                    }}
                  >
                    {submitting ? "Processing..." : `Register - KES ${reg.registration_amount}`}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Teams List Column */}
          <div className="col-12 col-lg-6">
            <div className="bg-light rounded-4 p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-primary mb-0">Enlisted Teams</h5>
                <span className="badge bg-secondary rounded-pill px-3">
                  {teams.length}
                </span>
              </div>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {teams.length > 0 ? (
                  teams.map((team, index) => (
                    <div
                      key={team.id || index}
                      className="d-flex justify-content-between align-items-center bg-white rounded-3 p-3 mb-2 shadow-sm"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="fw-bold text-primary" style={{ width: "30px" }}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="fw-bold">{team.team_name}</div>
                          <small className="text-muted">@{team.username}</small>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          team.status === "confirmed"
                            ? "bg-success"
                            : "bg-warning text-dark"
                        } px-3 py-2`}
                      >
                        {team.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 bg-white rounded-3">
                    <div className="mb-2" style={{ fontSize: "3rem" }}>🎮</div>
                    <p className="text-muted mb-0">No teams yet</p>
                    <small className="text-muted">Be the first to register!</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
          border-color: #667eea;
        }
      `}</style>
    </main>
  );
}