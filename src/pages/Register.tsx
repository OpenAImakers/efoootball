"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ team_name: "", username: "", whatsapp: "+254" });
  const [userReg, setUserReg] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]); // State for all teams
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Fetch current user registration
      if (user) {
        const { data } = await supabase
          .from("tournament_registrations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setUserReg(data);
      }

      // 2. Fetch all registered teams for the list
      const { data: teams } = await supabase
        .from("tournament_registrations")
        .select("team_name, username, status, created_at")
        .order("created_at", { ascending: false });
      
      if (teams) setAllTeams(teams);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("tournament_registrations")
        .insert([{ ...formData, user_id: user?.id || null, status: "pending" }])
        .select().single();

      if (error) throw error;

      setMessage({ type: "success", text: "Entry submitted!" });
      setUserReg(data);
      setAllTeams([data, ...allTeams]); // Add new team to top of list immediately
    } catch (err: any) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main  className="mt-3" style={{ backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Navbar />

      <div className="container-fluid p-0">
        <div className="row g-0" style={{ minHeight: "calc(100vh - 56px)" }}>
          
          {/* LEFT SIDE: BANNER & STATUS */}
          <div className="col-lg-5 d-none d-lg-block position-relative" style={{
            backgroundImage: "url('/kicc.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "sticky",
            top: "56px",
            height: "calc(100vh - 56px)"
          }}>
            <div className="position-absolute inset-0 w-100 h-100" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}></div>
            <div className="position-relative z-1 d-flex flex-column justify-content-center align-items-center h-100 px-5">
              <div className="glass-card p-4 w-100 text-white shadow-lg" style={{ borderRadius: "20px", backdropFilter: "blur(12px)", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <h3 className="fw-bold mb-4">Account Dashboard</h3>
                {loading ? <div className="spinner-border spinner-border-sm"></div> : userReg ? (
                  <div className="fade-in">
                    <p className="small text-uppercase opacity-75 mb-0">Team Name</p>
                    <p className="fs-4 fw-bold mb-3">{userReg.team_name}</p>
                    <p className="small text-uppercase opacity-75 mb-0">Status</p>
                    <span className={`badge ${userReg.status === 'confirmed' ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2`}>
                      {userReg.status.toUpperCase()}
                    </span>
                  </div>
                ) : <p className="opacity-75">No registration found. Join the battle!</p>}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: FORM & TEAM LIST */}
          <div className="col-lg-7 bg-white p-4 p-md-5 overflow-auto">
            <div className="mx-auto" style={{ maxWidth: "600px" }}>
              
              {/* Registration Form Section */}
              <section className="mb-5 pb-5 border-bottom">
                <h2 className="fw-bold text-dark mb-1">Tournament Entry</h2>


                {message && <div className={`alert alert-${message.type} fw-bold`}>{message.text}</div>}

                {userReg ? (
                  <div className="p-4 rounded-4 bg-light text-center border">
                    <h5 className="fw-bold text-success mb-1">✓ You are registered</h5>
                    <p className="text-muted small mb-0">Brackets will be generated once registration closes.keep tuned!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold">TEAM NAME</label>
                      <input type="text" className="form-control bg-light border-0 py-2" value={formData.team_name} onChange={(e) => setFormData({ ...formData, team_name: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">USERNAME</label>
                      <input type="text" className="form-control bg-light border-0 py-2" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">WHATSAPP</label>
                      <input type="text" className="form-control bg-light border-0 py-2" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} required />
                    </div>
                    <div className="col-12 mt-4">
                      <button type="submit" className="btn btn-primary w-100 fw-bold py-3 shadow" disabled={submitting}>
                        {submitting ? "Processing..." : "Register My Team"}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* Registered Teams List Section */}
              <section>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">Registered Teams</h4>
                  <span className="badge bg-dark rounded-pill">{allTeams.length} Total</span>
                </div>

                <div className="list-group list-group-flush">
                  {allTeams.length > 0 ? allTeams.map((team, idx) => (
                    <div key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom-dashed">
                      <div className="d-flex align-items-center">
                        <div className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px", fontWeight: "bold" }}>
                          {idx + 1}
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">{team.team_name}</h6>
                          <small className="text-muted">@{team.username}</small>
                        </div>
                      </div>
                      <span className={`small fw-bold ${team.status === 'confirmed' ? 'text-success' : 'text-warning'}`}>
                         ● {team.status}
                      </span>
                    </div>
                  )) : (
                    <p className="text-muted text-center py-4">No teams registered yet. Be the first!</p>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        .border-bottom-dashed { border-bottom: 1px dashed #dee2e6; }
        .form-control:focus { background-color: #fff !important; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1); border: 1px solid #0d6efd !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </main>
  );
}