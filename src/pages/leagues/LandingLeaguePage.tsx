import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";
import { loginToLeague } from "../../Utils/LeagueSesssion";
import { useNavigate } from "react-router-dom";

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
      .select("*"); // Fetch all to show in preview

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

  // Get the first match for the "Live Preview"
  const previewLeague = searchTerm.length > 1 ? filteredLeagues[0] : null;

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami">
      <LeaguesNavbar />

      <div className="container py-5">
        {/* HEADER SECTION */}
        <div className="admin-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 gap-3">
    
        
          <button className="konami-btn-primary" onClick={() => navigate("/add-league")}>
            <i className="bi bi-plus-square-fill me-2"></i> CREATE NEW LEAGUE
          </button>
      
        </div>

        <div className="row g-4">
          {/* SEARCH FORM PANEL */}
          <div className="col-lg-7">
            <div className="terminal-panel p-4">
            
              <div className="input-group konami-input-group mb-4">
                <span className="input-group-text bg-transparent border-primary border-opacity-50">
                  <i className="bi bi-search text-konami-blue"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-transparent text-white border-primary border-opacity-50 shadow-none"
                  placeholder="ENTER LEAGUE IDENTIFIER..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="results-list custom-scrollbar" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {searchTerm && filteredLeagues.length > 0 ? (
                  filteredLeagues.map((league) => (
                    <div key={league.id} className="search-result-item d-flex justify-content-between align-items-center p-3 mb-2">
                      <div>
                        <div className="fw-bold italic text-uppercase">{league.name}</div>
                        <div className="smaller opacity-50 tracking-widest">{league.season || "S1"} • ID: {league.id}</div>
                      </div>
                      <button className="konami-badge-btn" onClick={() => handleManageClick(league)}>
                        MANAGE
                      </button>
                    </div>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-4 opacity-50 italic">NO MATCHING SECTORS FOUND</div>
                ) : (
                  <div className="text-center py-4 opacity-25 italic"></div>
                )}
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW PANEL */}
          <div className="col-lg-5">
            <div className="preview-container">
              {previewLeague ? (
                <div className="preview-card-wrap animate-fade-in">
                   <div className="league-card mini-preview">
                    <div className="card-header-info d-flex justify-content-between p-2">
                      <span className="small-tag season-tag">{previewLeague.season}</span>
                      <span className="small-tag region-tag">{previewLeague.country}</span>
                    </div>
                    <div className="card-body-main text-center p-3">
                      <div className="card-avatar-hex mx-auto mb-2">
                        <img src={previewLeague.avatar_url || "/cup.png"} className="card-img" alt="" />
                      </div>
                      <h5 className="league-title text-uppercase italic fw-bold m-0">{previewLeague.name}</h5>
                      <p className="smaller opacity-75 mt-1">{previewLeague.short_intro}</p>
                    </div>
                  </div>
                  <div className="scan-line"></div>
                </div>
              ) : (
                <div className="preview-placeholder d-flex align-items-center justify-content-center text-center p-5">
                  <div className="opacity-25">
                    <i className="bi bi-display fs-1 d-block mb-2"></i>
                    <span className="smaller">SEARCH A LEAGUE TO MANAGE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KONAMI OVERLAY */}
      {selectedLeague && (
        <div className="konami-overlay d-flex align-items-center justify-content-center p-3">
          <div className="konami-modal p-4 border border-primary border-opacity-50 shadow-lg">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h5 className="text-uppercase italic fw-black m-0">Identity Required</h5>
                <p className="smaller text-konami-blue m-0">VERIFYING ACCESS TO: {selectedLeague.name}</p>
              </div>
              <i className="bi bi-shield-lock text-warning fs-3"></i>
            </div>
            
            <input
              type="password"
              className="konami-input w-100 mb-4 text-center"
              placeholder="••••••••"
              autoFocus
              value={tempPasskey}
              onChange={(e) => setTempPasskey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAccess()}
            />

            <div className="d-flex gap-2">
              <button className="konami-badge-btn flex-grow-1 py-2" onClick={confirmAccess}>VERIFY ACCESS</button>
              <button className="btn btn-sm text-white opacity-50 text-uppercase fw-bold" onClick={() => setSelectedLeague(null)}>Abort</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-konami-dark {
          background-color: #030a1a;
          background-image: radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
        }

        /* Create Button - High Visibility */
        .konami-btn-primary {
          background: #0d6efd;
          color: white;
          border: none;
          padding: 12px 24px;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 1px;
          clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%);
          box-shadow: 0 0 20px rgba(13, 110, 253, 0.4);
          transition: 0.3s;
        }
        .konami-btn-primary:hover {
          transform: scale(1.05);
          background: #58a6ff;
          box-shadow: 0 0 30px rgba(13, 110, 253, 0.6);
        }

        .terminal-panel {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(13, 110, 253, 0.2);
          border-radius: 4px;
        }

        .search-result-item {
          background: rgba(13, 110, 253, 0.05);
          border-left: 3px solid #0d6efd;
          transition: 0.2s;
        }
        .search-result-item:hover {
          background: rgba(13, 110, 253, 0.15);
          transform: translateX(5px);
        }

        /* Preview Card Styles */
        .preview-container {
          background: rgba(13, 110, 253, 0.03);
          border: 1px dashed rgba(13, 110, 253, 0.3);
          padding: 20px;
          border-radius: 8px;
          position: sticky;
          top: 20px;
        }

        .preview-placeholder {
          height: 250px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .preview-card-wrap { position: relative; overflow: hidden; }

        .mini-preview {
            background: rgba(13, 110, 253, 0.1);
            border: 1px solid #0d6efd;
            clip-path: polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%);
        }

        .scan-line {
          position: absolute; top: 0; left: 0; width: 100%; height: 2px;
          background: rgba(88, 166, 255, 0.5);
          box-shadow: 0 0 10px #58a6ff;
          animation: scan 3s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }

        .tiny-label { font-size: 0.6rem; font-weight: 900; letter-spacing: 2px; }
        .fw-black { font-weight: 900; }
        
        /* Re-using your card styles but smaller for preview */
        .card-avatar-hex {
          width: 70px; height: 70px; background: #000;
          border: 2px solid #0d6efd;
          clip-path: polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%);
        }
        .card-img { width: 100%; height: 100%; object-fit: cover; }
        .small-tag { font-size: 0.55rem; font-weight: 800; padding: 1px 6px; background: rgba(0,0,0,0.5); border: 1px solid #0d6efd; }
        .season-tag { color: #58a6ff; }

        .konami-badge-btn {
          background: #0d6efd; color: white; border: none;
          font-weight: 700; font-size: 0.75rem; padding: 6px 18px;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }

        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}