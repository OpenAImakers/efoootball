import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import LeaguesNavbar from "./Leaguenav";
import { loginToLeague } from "../../Utils/LeagueSesssion";

export default function AddLeague() {
  const navigate = useNavigate();

  const [leagueData, setLeagueData] = useState({
    name: "",
    organizer: "",
    passkey: "",
    rules: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeagueData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueData.name || !leagueData.organizer) {
      return alert("League Name and Organizer are required");
    }

    const created_by = "54027c85-0e61-403e-8b39-20ff7a457643";

    const { data, error } = await supabase
      .from("leagues")
      .insert([{ ...leagueData, created_by }])
      .select()
      .single();

    if (error) return alert("Error creating league: " + error.message);

    if (data) {
      loginToLeague(data.id, data.name);
      navigate("/manage-league");
    }
  };

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami">
      <LeaguesNavbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            {/* Header with slant decoration */}
            <div className="mb-4 border-bottom border-primary pb-2">
              <h3 className="fw-bold italic text-uppercase tracking-widest m-0">Register League</h3>
           
            </div>

            <form onSubmit={handleSubmit} className="konami-form">
              <div className="mb-4">
                <label className="konami-label">League Name *</label>
                <input
                  type="text"
                  name="name"
                  className="konami-input"
                  placeholder="E.G. PRO CHAMPIONS LEAGUE"
                  value={leagueData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="konami-label">Organizer *</label>
                <input
                  type="text"
                  name="organizer"
                  className="konami-input"
                  placeholder="E.G. KONAMI DIGITAL"
                  value={leagueData.organizer}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="konami-label">Passkey </label>
                <input
                  type="text"
                  name="passkey"
                  className="konami-input"
                  placeholder="SET ACCESS CODE"
                  value={leagueData.passkey}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-5">
                <button type="submit" className="konami-submit-btn w-100">
                  CONFIRM & CREATE LEAGUE
                </button>
                <button 
                  type="button" 
                  className="btn btn-link text-konami-blue w-100 mt-3 smaller text-decoration-none"
                  onClick={() => navigate(-1)}
                >
                  <i className="bi bi-arrow-left me-2"></i> RETURN TO OPERATIONS
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --konami-bg: #030a1a;
          --konami-border: #0d6efd;
          --konami-blue-text: #58a6ff;
        }

        .bg-konami-dark {
          background-color: var(--konami-bg);
          background-image: radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
        }

        .text-konami-blue { color: var(--konami-blue-text); }
        .italic { font-style: italic; }
        .tracking-widest { letter-spacing: 2px; }
        .smaller { font-size: 0.75rem; font-weight: 700; }

        .konami-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--konami-blue-text);
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .konami-input {
          width: 100%;
          background: rgba(13, 110, 253, 0.05);
          border: 1px solid rgba(13, 110, 253, 0.3);
          color: white;
          padding: 12px 15px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .konami-input:focus {
          outline: none;
          background: rgba(13, 110, 253, 0.1);
          border-color: var(--konami-border);
          box-shadow: 0 0 10px rgba(13, 110, 253, 0.2);
        }

        .konami-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
          font-size: 0.8rem;
        }

        .konami-submit-btn {
          background: var(--konami-border);
          color: white;
          border: none;
          padding: 14px;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 1px;
          clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%);
          transition: transform 0.1s, background 0.2s;
        }

        .konami-submit-btn:hover {
          background: #0b5ed7;
          transform: scale(1.02);
        }

        .konami-submit-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}