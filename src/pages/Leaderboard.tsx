"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Advert from "../components/Advert";
import { supabase } from "../supabase";

interface LeaderboardRow {
  rank: number;
  username: string;
  display_name: string;
  tournaments_played: any;
  mp: any;
  w: any;
  d: any;
  l: any;
  goals: any;
  against: any;
  gd: any;
  points: any;
}

interface League {
  id: number;
  name: string;
  organizer: string;
  short_intro: string;
  country: string;
  season: string;
  avatar_url?: string;
}

const KenyaEfootballHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"rankings" | "leagues">("rankings");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      const [profilesRes, leaguesRes] = await Promise.all([
        supabase.from("profiles").select("username, display_name").order("display_name", { ascending: true }),
        supabase.from("leagues").select("*").order("id", { ascending: true })
      ]);

      if (profilesRes.data) {
        setRows(profilesRes.data.map((p, i) => ({
          rank: i + 1,
          username: p.username,
          display_name: p.display_name || p.username,
          tournaments_played: "--",
          mp: 0, w: 0, d: 0, l: 0, goals: 0, against: 0, gd: 0, points: 0
        })));
      }
      if (leaguesRes.data) setLeagues(leaguesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami pb-5">
      <Advert />

      <div className="container-fluid px-4 pt-5 mt-4">
        {/* TACTICAL TAB SWITCHER */}
        <div className="d-flex justify-content-center mb-5">
          <div className="tab-switcher p-1 bg-black bg-opacity-50 rounded-pill border border-primary border-opacity-25">
            <button 
              className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
              onClick={() => setActiveTab('rankings')}
            >
              <i className="bi bi-trophy-fill me-2"></i> Rankings
            </button>
            <button 
              className={`tab-btn ${activeTab === 'leagues' ? 'active' : ''}`}
              onClick={() => setActiveTab('leagues')}
            >
              <i className="bi bi-controller me-2"></i> Leagues
            </button>
          </div>
        </div>

        <div className="animate-fade-in">
          {activeTab === "rankings" ? (
            <div className="container">
              <div className="d-flex justify-content-between align-items-end mb-4">
                <h2 className="text-uppercase italic fw-black m-0 tracking-tighter">
                  <span className="text-konami-blue">Rankings</span>
                </h2>
                <span className="badge-status">STATS LIVE</span>
              </div>
              
              <div className="table-responsive rounded-3 border border-secondary border-opacity-25 bg-black bg-opacity-40 shadow-lg">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead className="bg-dark shadow-sm">
                    <tr className="smaller text-konami-blue opacity-75 text-uppercase">
                      <th className="ps-4">Rank</th>
                      <th>Player</th>
                      <th className="text-center">MP</th>
                      <th className="text-center text-success">W</th>
                      <th className="text-center text-danger">L</th>
                      <th className="text-center pe-4">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.username} onClick={() => navigate(`/team/${row.username}/matches`)} style={{ cursor: "pointer" }}>
                        <td className="ps-4 fw-bold">{idx + 1}</td>
                        <td className="fw-bold text-info">{row.display_name}</td>
                        <td className="text-center opacity-50">{row.mp}</td>
                        <td className="text-center text-success opacity-75">{row.w}</td>
                        <td className="text-center text-danger opacity-75">{row.l}</td>
                        <td className="text-center pe-4 fw-black text-warning">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {leagues.map((league) => (
                <div key={league.id} className="col-12 col-md-6 col-xl-4 col-xxl-3">
                  <div className="league-card" onClick={() => navigate(`/league/${league.id}`)}>
                    <div className="card-glitch-overlay"></div>
                    <div className="card-header-info d-flex justify-content-between p-3">
                      <span className="small-tag season-tag">{league.season || "S1"}</span>
                      <span className="small-tag region-tag">{league.country || "KENYA"}</span>
                    </div>
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
                      <h4 className="league-title text-uppercase italic fw-bold mb-1">{league.name}</h4>
                      <p className="league-intro smaller opacity-75">
                        {league.short_intro || "Initializing sector data..."}
                      </p>
                    </div>
                    <div className="card-footer-terminal mt-auto d-flex align-items-center justify-content-between px-3 py-2">
                      <div className="organizer-info text-start">
                        <div className="tiny-label">ORGANIZER</div>
                        <div className="organizer-name fw-bold">{league.organizer || "SYSTEM"}</div>
                      </div>
                      <div className="card-action-icon"><i className="bi bi-chevron-right"></i></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        :root {
          --k-blue: #0d6efd;
          --k-glow: #58a6ff;
          --k-dark: #030a1a;
          --k-card-bg: rgba(13, 110, 253, 0.05);
          --k-border: rgba(13, 110, 253, 0.4);
        }
        .bg-konami-dark {
          background-color: var(--k-dark);
          background-image: radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
        }
        .tab-btn {
          background: transparent; border: none; color: rgba(255, 255, 255, 0.5);
          padding: 8px 25px; border-radius: 50px; font-weight: 800;
          text-transform: uppercase; font-style: italic; font-size: 0.8rem;
          letter-spacing: 1px; transition: 0.3s;
        }
        .tab-btn.active {
          background: var(--k-blue); color: white;
          box-shadow: 0 0 15px rgba(13, 110, 253, 0.5);
        }
        .league-card {
          position: relative; background: var(--k-card-bg); border: 1px solid var(--k-border);
          height: 100%; min-height: 280px; display: flex; flex-direction: column;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden; clip-path: polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%);
        }
        .league-card:hover {
          background: rgba(13, 110, 253, 0.12); border-color: var(--k-glow);
          transform: translateY(-5px);
        }
        .card-avatar-hex {
          width: 90px; height: 90px; background: #000;
          border: 2px solid var(--k-blue);
          clip-path: polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%);
          margin: auto;
        }
        .card-img { width: 100%; height: 100%; object-fit: cover; }
        .small-tag { font-size: 0.6rem; font-weight: 800; padding: 2px 8px; background: rgba(0,0,0,0.5); border: 1px solid var(--k-border); }
        .season-tag { color: var(--k-glow); }
        .card-footer-terminal { background: rgba(0,0,0,0.4); border-top: 1px solid var(--k-border); }
        .tiny-label { font-size: 0.5rem; color: var(--k-glow); letter-spacing: 1px; }
        .organizer-name { font-size: 0.75rem; text-transform: uppercase; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .text-konami-blue { color: var(--k-glow); }
        .italic { font-style: italic; }
        .smaller { font-size: 0.7rem; }
        .fw-black { font-weight: 900; }
        .badge-status {
          font-size: 0.7rem; font-weight: 900; color: #00ff88;
          border: 1px solid #00ff88; padding: 4px 10px;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
};

export default KenyaEfootballHub;