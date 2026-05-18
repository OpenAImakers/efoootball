"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const REGISTRATION_CACHE_KEY = "registrations_cache";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minutes

export default function RegisterPage() {
  const navigate = useNavigate();
  
  // State
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Record<number, any[]>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Initial Cache on Mount
  useEffect(() => {
    const cached = localStorage.getItem(REGISTRATION_CACHE_KEY);
    if (cached) {
      const { registrations: cRegs, teamsMap: cTeamsMap, profilesMap: cProfilesMap } = JSON.parse(cached);
      if (cRegs) setRegistrations(cRegs);
      if (cTeamsMap) setTeamsMap(cTeamsMap);
      if (cProfilesMap) setProfilesMap(cProfilesMap);
    }
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
    try {
      const { data: regs } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!regs) return;
      setRegistrations(regs);

      // Fetch profiles for created_by users
      const userIds = regs.map(reg => reg.created_by).filter(Boolean);
      let profilesObj: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);
        
        profiles?.forEach(profile => {
          profilesObj[profile.id] = profile;
        });
        setProfilesMap(profilesObj);
      }

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

      // Update Cache
      localStorage.setItem(REGISTRATION_CACHE_KEY, JSON.stringify({
        registrations: regs,
        teamsMap: grouped,
        profilesMap: profilesObj,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Set up auto-refresh and initial fetch
  useEffect(() => {
    fetchData();

    refreshTimer.current = setInterval(() => {
      fetchData(true); // silent refresh every 5 mins
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchData]);

  // Filter registrations based on search
  const filteredRegistrations = registrations.filter(reg =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
      <Navbar />

      {/* Sticky Header with Search and Create Button */}
      <div 
        className="container-fluid px-4 py-3"
        style={{
          position: "sticky",
          top: "68px",
          zIndex: 1020,
          backgroundColor: "#f0f2f5",
          borderBottom: "1px solid #dee2e6"
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          {/* Search Bar - Left */}
          <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
            <input
              type="text"
              className="form-control form-control-lg shadow-sm"
              placeholder="Search Registrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                backgroundColor: "white"
              }}
            />
          </div>

          {/* Create Button - Right */}
          <button
            onClick={() => navigate("/registrations")}
            className="btn btn-primary btn-lg shadow-sm px-4 py-2"
            style={{
              background: "linear-gradient(135deg, #35962e 0%, #863131 100%)",
              border: "none",
              fontWeight: "600",
              borderRadius: "8px"
            }}
          >
            + Have a squad? Create a registration here
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid px-4 py-3">
        {loading && registrations.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredRegistrations.length === 0 ? (
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
              
              // Calculate total budget
              const totalBudget = reg.max_players * reg.registration_amount;
              
              // Get host/sponsor profile
              const hostProfile = reg.created_by ? profilesMap[reg.created_by] : null;
              const hostName = hostProfile?.display_name || hostProfile?.username || reg.created_by?.slice(0, 8) || "Anonymous";

              return (
                <div key={reg.id} className="col-12">
                  {/* Tournament Card */}
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
                            <small className="text-muted d-block">Total Budget</small>
                            <strong className="fs-5 text-primary">
                              KES {totalBudget.toLocaleString()}
                            </strong>
                          </div>
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
                          <div>
                            <small className="text-muted d-block">Host/Sponsor</small>
                            <strong className="fs-5 text-primary">
                              {hostName}
                            </strong>
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
                  <div 
  className="d-flex align-items-center justify-content-between bg-white p-3 rounded-4 shadow-sm border mb-3" 
  style={{ cursor: "pointer", transition: "0.2s" }}
  onClick={async () => {
    const regId = reg.id;
    const shareUrl = `https://efootballkenyaleague.website/registration/${regId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: reg.name || "eFootball Tournament",
          text: `Entry Fee: KES ${reg.registration_amount}. Join the ${reg.name} squad!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: Copy clean URL
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied! Paste it in WhatsApp or Telegram.");
    }
  }}
  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
>
  <div>
    <h6 className="mb-0 fw-bold">Invite Players</h6>
    <small className="text-muted">Share this tournament link</small>
  </div>
  <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
    <i className="bi bi-share-fill text-primary"></i>
  </div>
</div>

                        <div className="mt-2 mt-sm-0">
                          {/* Register link - navigates to specific registration page */}
                          <strong className="fs-5 text-primary">Register</strong>
                          <i 
                            className="bi bi-pencil-square ms-2 fs-5 text-primary" 
                            style={{ cursor: "pointer" }} 
                            onClick={() => navigate(`/registration/${reg.id}`)}
                          />
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
      `}</style>
    </main>
  );
}