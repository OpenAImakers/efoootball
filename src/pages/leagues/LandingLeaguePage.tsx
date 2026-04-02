import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";
import { loginToLeague } from "../../Utils/LeagueSesssion";
import { useNavigate } from "react-router-dom";

export default function LeagueOperations() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Overlay State
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [tempPasskey, setTempPasskey] = useState("");

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    const { data, error } = await supabase
      .from("leagues")
      .select("id, name, passkey");

    if (error) return console.error(error);
    setLeagues(data);
  };

  const handleManageClick = (league) => {
    // If no passkey required, go straight in
    if (!league.passkey) {
      loginToLeague(league.id, league.name);
      navigate("/manage-league");
    } else {
      // Open overlay
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

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami">
      <LeaguesNavbar />

      <div className="container-fluid px-4 py-4">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-primary pb-3">
          <h4 className="m-0 italic fw-bold text-uppercase tracking-widest">League Operations</h4>
          <button className="konami-btn-outline" onClick={() => navigate("/add-league")}>
            <i className="bi bi-plus-lg me-2"></i>CREATE NEW LEAGUE
          </button>
        </div>

        <div className="search-section mb-5">
          <label className="small text-konami-blue fw-bold text-uppercase mb-2 d-block">System Search</label>
          <div className="input-group konami-input-group">
            <span className="input-group-text bg-transparent border-primary border-end-0">
              <i className="bi bi-search text-konami-blue"></i>
            </span>
            <input
              type="text"
              className="form-control bg-transparent text-white border-primary border-start-0"
              placeholder="SEARCH LEAGUE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="results-container">
          {searchTerm && filteredLeagues.map((league) => (
            <div key={league.id} className="konami-row row mx-0 align-items-center py-3 mb-2 px-3">
              <div className="col-8">
                <h6 className="m-0 text-uppercase italic fw-bold">{league.name}</h6>
                
              </div>
              <div className="col-4 text-end">
                <button className="konami-badge-btn" onClick={() => handleManageClick(league)}>
                  MANAGE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KONAMI OVERLAY */}
      {selectedLeague && (
        <div className="konami-overlay d-flex align-items-center justify-content-center">
          <div className="konami-modal p-4 border border-primary shadow-lg">
            <h5 className="text-uppercase italic fw-black mb-1">Security Authentication</h5>
            <p className="smaller text-konami-blue mb-4">ACCESSING: {selectedLeague.name}</p>
            
            <input
              type="password"
              className="konami-input w-100 mb-4"
              placeholder="ENTER PASSKEY"
              autoFocus
              value={tempPasskey}
              onChange={(e) => setTempPasskey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAccess()}
            />

            <div className="d-flex gap-2">
              <button className="konami-badge-btn flex-grow-1" onClick={confirmAccess}>VERIFY</button>
              <button className="btn btn-sm btn-outline-danger border-0 text-uppercase fw-bold" onClick={() => setSelectedLeague(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-konami-dark {
          background-color: #030a1a;
          background-image: radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
        }
        .text-konami-blue { color: #58a6ff; }
        .konami-row {
          background: rgba(13, 110, 253, 0.05);
          border-bottom: 1px solid rgba(13, 110, 253, 0.2);
        }
        .konami-badge-btn {
          background: #0d6efd;
          color: white;
          border: none;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 5px 20px;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }
        /* OVERLAY STYLES */
        .konami-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 10, 30, 0.9);
          backdrop-filter: blur(4px);
          z-index: 2000;
        }
        .konami-modal {
          background: #030a1a;
          width: 90%;
          max-width: 400px;
          position: relative;
        }
        .konami-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #0d6efd;
          color: white;
          padding: 10px;
          font-family: monospace;
          letter-spacing: 2px;
        }
        .konami-btn-outline {
          background: transparent;
          color: #58a6ff;
          border: 1px solid #0d6efd;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 8px 15px;
          clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
}