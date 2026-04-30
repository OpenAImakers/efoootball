"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  
  // State
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Record<number, any[]>>({});
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<Record<number, { type: string; text: string } | null>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: userData },
      } = await supabase.auth.getUser();
      setUser(userData || null);

      const { data: regs } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!regs) return;
      setRegistrations(regs);

      const initialFormData: Record<number, any> = {};
      regs.forEach((reg) => {
        initialFormData[reg.id] = {
          team_name: "",
          username: "",
          whatsapp: "+254",
        };
      });
      setFormData(initialFormData);

      const { data: teams } = await supabase
        .from("tournament_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      const grouped: Record<number, any[]> = {};
      teams?.forEach((team) => {
        if (!grouped[team.registration_id]) grouped[team.registration_id] = [];
        grouped[team.registration_id].push(team);
      });
      setTeamsMap(grouped);
    };

    fetchData();
  }, []);

  // Filter registrations based on search
  const filteredRegistrations = registrations.filter(reg =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkUserRegistered = async (regId: number, userId: string) => {
    const { data } = await supabase
      .from("tournament_registrations")
      .select("id")
      .eq("registration_id", regId)
      .eq("user_id", userId)
      .maybeSingle();
    return !!data;
  };


  const handleSubmit = async (e: React.FormEvent, regId: number) => {
    e.preventDefault();
    
    setSubmitting((prev) => ({ ...prev, [regId]: true }));
    setMessages((prev) => ({ ...prev, [regId]: null }));

    const reg = registrations.find((r) => r.id === regId);
    const teams = teamsMap[regId] || [];
    const data = formData[regId];

    if (teams.length >= reg.max_players) {
      setMessages((prev) => ({
        ...prev,
        [regId]: { type: "danger", text: `${reg.name} is full! Max ${reg.max_players} teams.` }
      }));
      setSubmitting((prev) => ({ ...prev, [regId]: false }));
      return;
    }

    if (user) {
      const alreadyRegistered = await checkUserRegistered(regId, user.id);
      if (alreadyRegistered) {
        setMessages((prev) => ({
          ...prev,
          [regId]: { type: "danger", text: `You're already registered for ${reg.name}!` }
        }));
        setSubmitting((prev) => ({ ...prev, [regId]: false }));
        return;
      }
    }

    try {
      const { data: inserted, error } = await supabase
        .from("tournament_registrations")
        .insert([
          {
            ...data,
            registration_id: regId,
            user_id: user?.id || null,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => ({
        ...prev,
        [regId]: { type: "success", text: "Registration Successful!" }
      }));

      setTeamsMap((prev) => ({
        ...prev,
        [regId]: [inserted, ...(prev[regId] || [])],
      }));

      setFormData((prev) => ({
        ...prev,
        [regId]: { team_name: "", username: "", whatsapp: "+254" },
      }));
    } catch (err: any) {
      setMessages((prev) => ({
        ...prev,
        [regId]: { type: "danger", text: err.message }
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [regId]: false }));
    }
  };

  const getUserRegistrationForTournament = (regId: number) => {
    const teams = teamsMap[regId] || [];
    if (!user) return null;
    return teams.find((team) => team.user_id === user.id);
  };

  return (
    <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
      <Navbar />

      {/* Header with Search and Create Button */}
      <div className="container-fluid px-4 mt-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          {/* Search Bar - Left */}
          <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-lg rounded-pill shadow-sm"
                placeholder="Search Registrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: "45px",
                  border: "none",
                  backgroundColor: "white"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                  fontSize: "1.1rem"
                }}
              >        
              </div>
            </div>
          </div>

          {/* Create Button - Right */}
          <button
            onClick={() => navigate("/registrations")}
            className="btn btn-primary btn-lg rounded-pill shadow-sm px-4 py-2"
            style={{
              background: "linear-gradient(135deg, #35962e 0%, #863131 100%)",
              border: "none",
              fontWeight: "600"
            }}
          >
            + Have a squad? Create a registration here
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid px-4 py-3">
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted">
              {searchTerm ? "No tournaments match your search" : "No active tournaments"}
            </h5>
            {!searchTerm && (
              <button
                onClick={() => navigate("/registrations")}
                className="btn btn-outline-primary mt-3 rounded-pill"
              >
                Create the first tournament
              </button>
            )}
          </div>
        ) : (
          <div className="row g-4">
            {filteredRegistrations.map((reg) => {
              const teams = teamsMap[reg.id] || [];
              const isFull = teams.length >= reg.max_players;
              const userReg = getUserRegistrationForTournament(reg.id);
              const currentFormData = formData[reg.id] || {
                team_name: "",
                username: "",
                whatsapp: "+254",
              };
              const isSubmitting = submitting[reg.id] || false;
              const message = messages[reg.id] || null;

              return (
                <div key={reg.id} className="col-12">
                  {/* SINGLE CARD for entire registration */}
                  <div className="card border-0 shadow rounded-4 overflow-hidden">
                    {/* Banner Section */}
                    <div
                      className="position-relative"
                      style={{
                        background: `linear-gradient(
                          to bottom,
                          #000 0%,
                          #000 20%,
                          #fff 20%,
                          #fff 25%,
                          #d21034 25%,
                          #d21034 50%,
                          #fff 50%,
                          #fff 55%,
                          #007847 55%,
                          #007847 80%,
                          #000 80%
                        )`,
                        padding: "50px 0",
                      }}
                    >
                      <div className="text-center">
                        <div className="moving-image-wrapper" style={{ display: "inline-block" }}>
                          <img
                            src={reg.avatar_url || "/kicc.jpeg"}
                            alt={reg.name}
                            className="img-fluid rounded-4 shadow-lg moving-image"
                            style={{
                              maxHeight: "240px",
                              width: "auto",
                              objectFit: "cover",
                              cursor: "pointer",
                            }}
                            onClick={() => navigate(`/tournament/${reg.id}`)}
                          />
                        </div>
                      </div>
                      
                      {/* Tournament name overlay */}
                      <div 
                        className="position-absolute bottom-0 start-0 end-0"
                        style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                          padding: "30px 20px 15px 20px",
                        }}
                      >
                        <h3 className="text-white mb-0 fw-bold text-center">{reg.name}</h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      {/* Tournament Info Bar */}
                      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
                        <div className="d-flex gap-4 flex-wrap">
                          <div>
                            <small className="text-muted d-block">Entry Fee</small>
                            <strong className="fs-5 text-primary">KES {reg.registration_amount}</strong>
                          </div>
                          <div>
                            <small className="text-muted d-block">Max Teams</small>
                            <strong className="fs-5">{reg.max_players}</strong>
                          </div>
                          <div>
                            <small className="text-muted d-block">Created</small>
                            <strong className="fs-5">{new Date(reg.created_at).toLocaleDateString()}</strong>
                          </div>
                        </div>
                        <div className="mt-2 mt-sm-0">
                          {isFull ? (
                            <span className="badge bg-danger px-3 py-2 fs-6">FULL</span>
                          ) : (
                            <span className="badge bg-primary px-3 py-2 fs-6">
                              {teams.length} / {reg.max_players} Teams
                            </span>
                          )}
                        </div>
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
                              <form onSubmit={(e) => handleSubmit(e, reg.id)}>
                                <div className="mb-3">
                                  <label className="form-label small fw-bold text-secondary">
                                    TEAM NAME
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control border-0 shadow-sm"
                                    placeholder="Enter your team name"
                                    value={currentFormData.team_name}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [reg.id]: {
                                          ...currentFormData,
                                          team_name: e.target.value,
                                        },
                                      })
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
                                    value={currentFormData.username}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [reg.id]: {
                                          ...currentFormData,
                                          username: e.target.value,
                                        },
                                      })
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
                                    value={currentFormData.whatsapp}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [reg.id]: {
                                          ...currentFormData,
                                          whatsapp: e.target.value,
                                        },
                                      })
                                    }
                                    required
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="btn btn-primary w-100 fw-bold py-2"
                                  disabled={isSubmitting}
                                  style={{
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    border: "none"
                                  }}
                                >
                                  {isSubmitting ? "Processing..." : `Register - KES ${reg.registration_amount}`}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .moving-image-wrapper {
          display: inline-block;
          overflow: hidden;
          border-radius: 16px;
        }

        .moving-image {
          animation: slideSide 6s ease-in-out infinite alternate;
          transition: transform 0.3s ease;
        }

        .moving-image:hover {
          transform: scale(1.02);
        }

        @keyframes slideSide {
          from {
            transform: translateX(-15px);
          }
          to {
            transform: translateX(15px);
          }
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
          border-color: #667eea;
        }

        .card {
          transition: box-shadow 0.2s ease;
        }

        .card:hover {
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }

        /* Custom scrollbar */
        div[style*="maxHeight: 400px"]::-webkit-scrollbar {
          width: 6px;
        }

        div[style*="maxHeight: 400px"]::-webkit-scrollbar-track {
          background: #e9ecef;
          border-radius: 10px;
        }

        div[style*="maxHeight: 400px"]::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }

        div[style*="maxHeight: 400px"]::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </main>
  );
}