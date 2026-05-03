import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";
import { loginToLeague } from "../../Utils/LeagueSesssion";
import { useNavigate } from "react-router-dom";

const BRAND = {
  NAVY: "#1A2251",
  ORANGE: "#F38D1F",
  CYAN: "#00B4D8",
  WHITE: "#FFFFFF",
  LIGHT_BG: "#F8F9FD"
};

export default function LeagueOperations() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [tempPasskey, setTempPasskey] = useState("");

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    const { data, error } = await supabase
      .from("leagues")
      .select("*");

    if (error) return console.error(error);
    setLeagues(data);
  };

  const handleManageClick = (league) => {
    if (!league.passkey) {
      loginToLeague(league.id, league.name);
      navigate("/manage-league");
    } else {
      setSelectedLeague(league);
      setTempPasskey("");
    }
  };

  const confirmAccess = () => {
    if (selectedLeague.passkey === tempPasskey) {
      loginToLeague(selectedLeague.id, selectedLeague.name);
      navigate("/manage-league");
    } else {
      alert("ACCESS DENIED: INCORRECT PASSKEY");
    }
  };

  const filteredLeagues = leagues.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const previewLeague = searchTerm.length > 1 ? filteredLeagues[0] : null;

  return (
    <div className="min-vh-100" style={{ backgroundColor: BRAND.LIGHT_BG }}>
      <LeaguesNavbar />

      <div className="container py-5">
        {/* HEADER SECTION */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
          <button 
            onClick={() => navigate("/add-league")}
            className="btn rounded-pill px-4 py-2 fw-bold shadow-sm"
            style={{ 
              backgroundColor: BRAND.ORANGE,
              color: BRAND.WHITE,
              border: "none",
              fontSize: "0.9rem"
            }}
          >
            <i className="bi bi-plus-square-fill me-2"></i> CREATE NEW LEAGUE
          </button>
        </div>

        <div className="row g-4">
          {/* SEARCH FORM PANEL */}
          <div className="col-lg-7">
            <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: BRAND.WHITE, border: `1px solid ${BRAND.NAVY}20` }}>
              <div className="input-group mb-4">
                <span className="input-group-text" style={{ backgroundColor: BRAND.LIGHT_BG, borderColor: BRAND.CYAN }}>
                  <i className="bi bi-search" style={{ color: BRAND.CYAN }}></i>
                </span>
                <input
                  type="text"
                  className="form-control shadow-none"
                  style={{ borderColor: BRAND.CYAN }}
                  placeholder="Search leagues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="custom-scrollbar" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {searchTerm && filteredLeagues.length > 0 ? (
                  filteredLeagues.map((league) => (
                    <div 
                      key={league.id} 
                      className="d-flex justify-content-between align-items-center p-3 mb-2 rounded-3"
                      style={{ 
                        backgroundColor: BRAND.LIGHT_BG,
                        borderLeft: `3px solid ${BRAND.CYAN}`,
                        transition: "0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BRAND.LIGHT_BG}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND.LIGHT_BG}
                    >
                      <div>
                        <div className="fw-bold" style={{ color: BRAND.NAVY }}>{league.name}</div>
                        <div className="small" style={{ color: BRAND.NAVY, opacity: 0.6 }}>{league.season || "S1"} • ID: {league.id}</div>
                      </div>
                      <button 
                        className="btn rounded-pill px-3 py-1 fw-bold"
                        style={{ 
                          backgroundColor: BRAND.NAVY,
                          color: BRAND.WHITE,
                          fontSize: "0.75rem",
                          border: "none"
                        }}
                        onClick={() => handleManageClick(league)}
                      >
                        MANAGE
                      </button>
                    </div>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-4" style={{ color: BRAND.NAVY, opacity: 0.5 }}>No matching leagues found</div>
                ) : (
                  <div className="text-center py-4"></div>
                )}
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW PANEL */}
          <div className="col-lg-5">
            <div className="rounded-4 p-4" style={{ 
              backgroundColor: BRAND.WHITE, 
              border: `1px solid ${BRAND.NAVY}20`,
              position: "sticky",
              top: "20px"
            }}>
              {previewLeague ? (
                <div className="animate-fade-in">
                  <div className="text-center p-4 rounded-4" style={{ backgroundColor: BRAND.LIGHT_BG }}>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: BRAND.CYAN, color: BRAND.WHITE, fontSize: "0.7rem" }}>
                        {previewLeague.season}
                      </span>
                      <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: BRAND.ORANGE, color: BRAND.WHITE, fontSize: "0.7rem" }}>
                        {previewLeague.country}
                      </span>
                    </div>
                    
                    <div className="mx-auto mb-3" style={{ 
                      width: "80px", 
                      height: "80px", 
                      backgroundColor: BRAND.NAVY,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `2px solid ${BRAND.CYAN}`
                    }}>
                      <img 
                        src={previewLeague.avatar_url || "/cup.png"} 
                        className="w-100 h-100" 
                        style={{ objectFit: "cover" }}
                        alt=""
                      />
                    </div>
                    
                    <h5 className="fw-bold mb-2" style={{ color: BRAND.NAVY }}>{previewLeague.name}</h5>
                    <p className="small" style={{ color: BRAND.NAVY, opacity: 0.7 }}>{previewLeague.short_intro}</p>
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-center p-5" style={{ minHeight: "300px" }}>
                  <div style={{ opacity: 0.3 }}>
                    <i className="bi bi-display fs-1 d-block mb-2" style={{ color: BRAND.NAVY }}></i>
                    <span className="small" style={{ color: BRAND.NAVY }}>Search a league to manage</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACCESS MODAL */}
      {selectedLeague && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ 
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 1050,
          backdropFilter: "blur(4px)"
        }}>
          <div className="rounded-4 p-4 shadow-lg" style={{ 
            backgroundColor: BRAND.WHITE,
            border: `2px solid ${BRAND.CYAN}`,
            maxWidth: "400px",
            width: "100%"
          }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: BRAND.NAVY }}>Identity Required</h5>
                <p className="small mb-0" style={{ color: BRAND.CYAN }}>Verifying access to: {selectedLeague.name}</p>
              </div>
              <i className="bi bi-shield-lock fs-3" style={{ color: BRAND.ORANGE }}></i>
            </div>
            
            <input
              type="password"
              className="form-control w-100 mb-4 text-center"
              style={{ 
                border: `1px solid ${BRAND.CYAN}`,
                borderRadius: "8px",
                padding: "10px"
              }}
              placeholder="••••••••"
              autoFocus
              value={tempPasskey}
              onChange={(e) => setTempPasskey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAccess()}
            />

            <div className="d-flex gap-2">
              <button 
                className="btn rounded-pill flex-grow-1 py-2 fw-bold"
                style={{ 
                  backgroundColor: BRAND.NAVY,
                  color: BRAND.WHITE,
                  border: "none"
                }}
                onClick={confirmAccess}
              >
                VERIFY ACCESS
              </button>
              <button 
                className="btn rounded-pill px-3"
                style={{ 
                  backgroundColor: "transparent",
                  color: BRAND.NAVY,
                  border: `1px solid ${BRAND.NAVY}`
                }}
                onClick={() => setSelectedLeague(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${BRAND.LIGHT_BG};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${BRAND.CYAN};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${BRAND.NAVY};
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .form-control:focus {
          box-shadow: 0 0 0 2px ${BRAND.CYAN}40;
          border-color: ${BRAND.CYAN};
        }
      `}</style>
    </div>
  );
}