"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";

interface League {
  id: number;
  name: string;
  organizer: string;
  short_intro: string;
  country: string;
  season: string;
  avatar_url?: string;
}

export default function Leagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, organizer, short_intro, country, season, avatar_url")
        .order('id', { ascending: true });

      if (error) throw error;
      setLeagues(data || []);
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami pb-5">
      <LeaguesNavbar />
      <div className="container-fluid px-4" style={{marginTop: "20px"}}>
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="konami-loader"></div>
          </div>
        ) : (
          /* Responsive Grid System */
          <div className="row g-4">
            {leagues.map((league) => (
              <div key={league.id} className="col-12 col-md-6 col-xl-4 col-xxl-3">
                <div 
                  className="league-card"
                  onClick={() => navigate(`/league/${league.id}`)}
                >
                  {/* Card Background Decoration */}
                  <div className="card-glitch-overlay"></div>
                  
                  {/* Top Bar: Season & Region */}
                  <div className="card-header-info d-flex justify-content-between p-3">
                    <span className="small-tag season-tag">{league.season || "S1"}</span>
                    <span className="small-tag region-tag">{league.country || "KENYA"}</span>
                  </div>

                  {/* Main Avatar Section */}
                  <div className="card-body-main px-3 pt-2 text-center">
                    <div className="card-avatar-container mb-3">
                      <div className="card-avatar-hex">
                        <img
                          src={league.avatar_url || "/cup.png"}
                          alt={league.name}
                          className="card-img"
                          onError={(e) => { e.currentTarget.src = "/cup.png" }}
                        />
                      </div>
                    </div>

                    <h4 className="league-title text-uppercase italic fw-bold mb-1">
                      {league.name}
                    </h4>
                    <p className="league-intro smaller opacity-75">
                      {league.short_intro || "Initializing sector data..."}
                    </p>
                  </div>

                  {/* Footer Bar: Organizer */}
                  <div className="card-footer-terminal mt-auto d-flex align-items-center justify-content-between px-3 py-2">
                    <div className="organizer-info">
                      <div className="tiny-label">ORGANIZER</div>
                      <div className="organizer-name fw-bold">{league.organizer || "SYSTEM"}</div>
                    </div>
                    <div className="card-action-icon">
                      <i className="bi bi-chevron-right"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* Core Variable Definitions */
        :root {
          --k-blue: #0d6efd;
          --k-glow: #58a6ff;
          --k-dark: #030a1a;
          --k-card-bg: rgba(13, 110, 253, 0.05);
          --k-border: rgba(13, 110, 253, 0.4);
        }

        .bg-konami-dark {
          background-color: var(--k-dark);
          background-image: 
            linear-gradient(rgba(13, 110, 253, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13, 110, 253, 0.02) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
          background-size: 40px 40px, 40px 40px, auto;
        }

        /* Tactical Card Styling */
        .league-card {
          position: relative;
          background: var(--k-card-bg);
          border: 1px solid var(--k-border);
          height: 100%;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
          clip-path: polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%);
        }

        .league-card:hover {
          background: rgba(13, 110, 253, 0.12);
          border-color: var(--k-glow);
          transform: translateY(-5px);
          box-shadow: 0 0 20px rgba(13, 110, 253, 0.2);
        }

        .league-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 100%;
          background: var(--k-blue);
          box-shadow: 0 0 10px var(--k-blue);
        }

        /* Avatar Hexagonal Styling */
        .card-avatar-container {
          display: flex;
          justify-content: center;
          padding: 10px;
        }

        .card-avatar-hex {
          width: 100px;
          height: 100px;
          background: #000;
          border: 2px solid var(--k-blue);
          clip-path: polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%);
          position: relative;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .league-card:hover .card-img {
          transform: scale(1.15) rotate(3deg);
        }

        /* Typography & Tags */
        .small-tag {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          background: rgba(0,0,0,0.5);
          border: 1px solid var(--k-border);
          letter-spacing: 1px;
        }

        .season-tag { color: var(--k-glow); }
        .region-tag { color: #fff; }

        .league-title {
          letter-spacing: -0.5px;
          color: #fff;
          text-shadow: 0 0 8px rgba(13, 110, 253, 0.5);
        }

        .league-intro {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
          height: 2.8em;
          padding: 0 10px;
        }

        .card-footer-terminal {
          background: rgba(0,0,0,0.4);
          border-top: 1px solid var(--k-border);
        }

        .tiny-label {
          font-size: 0.55rem;
          color: var(--k-glow);
          letter-spacing: 2px;
          font-weight: 900;
        }

        .organizer-name {
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .badge-status {
          font-size: 0.7rem;
          font-weight: 900;
          color: #00ff88;
          border: 1px solid #00ff88;
          padding: 4px 10px;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }

        /* Loading Animation */
        .konami-loader {
          width: 50px;
          height: 50px;
          border: 3px solid var(--k-card-bg);
          border-top: 3px solid var(--k-glow);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .smaller { font-size: 0.75rem; }
        .fw-black { font-weight: 900; }
        .tracking-tighter { letter-spacing: -1px; }
      `}</style>
    </div>
  );
}