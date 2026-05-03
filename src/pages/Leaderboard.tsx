"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Advert from "../components/Advert";
import { supabase } from "../supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Cache Config
const CACHE_KEY = "efootball_hub_data";
const CACHE_TTL = 1000 * 60 * 15; // 15 Minutes

interface LeaderboardRow {
  rank: number;
  username: string;
  display_name: string;
  tournaments_played: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  gd: number;
  win_rate: number;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        setRows(data.rows);
        setLeagues(data.leagues);
        return;
      }
    }
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [profilesRes, leaguesRes] = await Promise.all([
        supabase.from("profiles").select(`
          username, 
          display_name,
          teams ( w, d, l, gf, ga )
        `),
        supabase.from("leagues").select("*").order("id", { ascending: true })
      ]);

      let finalRows: LeaderboardRow[] = [];
      let finalLeagues: League[] = [];

      if (profilesRes.data) {
        const aggregated = profilesRes.data.map((p: any) => {
          const stats = (p.teams || []).reduce(
            (acc: any, team: any) => ({
              mp: acc.mp + (team.w + team.d + team.l || 0),
              w: acc.w + (team.w || 0),
              d: acc.d + (team.d || 0),
              l: acc.l + (team.l || 0),
              gf: acc.gf + (team.gf || 0),
              ga: acc.ga + (team.ga || 0),
            }),
            { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }
          );

          const winRate = stats.mp > 0 ? (stats.w / stats.mp) * 100 : 0;

          return {
            rank: 0,
            username: p.username,
            display_name: p.display_name || p.username,
            tournaments_played: p.teams?.length || 0,
            mp: stats.mp,
            w: stats.w,
            d: stats.d,
            l: stats.l,
            gd: stats.gf - stats.ga,
            win_rate: parseFloat(winRate.toFixed(1))
          };
        });

        const sorted = aggregated.sort((a, b) => b.win_rate - a.win_rate || b.gd - a.gd);
        finalRows = sorted.map((row, i) => ({ ...row, rank: i + 1 }));
        setRows(finalRows);
      }
      
      if (leaguesRes.data) {
        finalLeagues = leaguesRes.data;
        setLeagues(finalLeagues);
      }

      // Save to Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { rows: finalRows, leagues: finalLeagues },
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFillColor(3, 10, 26); 
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("KENYA EFOOTBALL RANKINGS", 14, 25);

    autoTable(doc, {
      startY: 45,
      head: [["Rank", "Player", "Teams", "MP", "W", "L", "GD", "Win %"]],
      body: rows.map(r => [r.rank, r.display_name, r.tournaments_played, r.mp, r.w, r.l, r.gd, `${r.win_rate}%`]),
      theme: "grid",
      headStyles: { fillColor: [13, 110, 253] }
    });

    // footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer Horizontal Line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

      // Skyla Text
      doc.setFontSize(10);
      doc.setTextColor(10, 26, 94); // Navy
      doc.setFont("helvetica", "bold");
      doc.text("Skyla", 14, pageHeight - 10);
      
      // Trademark symbol (®) as superscript
      const skylaWidth = doc.getTextWidth("Skyla");
      doc.setFontSize(6); // Smaller font for superscript
      doc.text("®", 14 + skylaWidth + 0.5, pageHeight - 12); // Slightly higher (y - 12 instead of 10)

      // Smart Ecosystem Text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      // Adjusted X position to account for the trademark symbol space
      doc.text("|  smart ecosystem", 14 + skylaWidth + 4, pageHeight - 10);

      // Page numbers (Right aligned)
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: "right" }
      );
    }


    doc.save(`Kenya_eFootball_Rankings_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami pb-5">
    
      <Advert />

      <div className="container-fluid px-4 pt-5 mt-4">
        {/* ACTION BUTTONS AT THE TOP */}
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button 
            className="btn btn-outline-info btn-sm rounded-pill px-3"
            onClick={fetchHubData}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spinner-border spinner-border-sm' : ''}`}></i>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn btn-outline-success btn-sm rounded-pill px-3"
            onClick={exportToPDF}
          >
            <i className="bi bi-download me-1"></i> Download PDF
          </button>
        </div>

        <div className="d-flex justify-content-center mb-5">
          <div className="tab-switcher p-1 bg-black bg-opacity-50 rounded-pill border border-primary border-opacity-25">
            <button 
              className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
              onClick={() => setActiveTab('rankings')}
            >
              <i className="bi bi-trophy-fill me-2"></i> Leaderboard
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
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-end mb-4">
               <span className="text-konami-blue">KENYA EFOOTBALL RANKINGS</span>
              </div>
              
              <div className="table-responsive rounded-3 border border-secondary border-opacity-25 bg-black bg-opacity-40 shadow-lg">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead className="bg-dark shadow-sm">
                    <tr className="smaller text-konami-blue opacity-75 text-uppercase">
                      <th className="ps-4">Rank</th>
                      <th>Player</th>
                      <th className="text-center">Teams</th>
                      <th className="text-center">MP</th>
                      <th className="text-center text-success">W</th>
                      <th className="text-center text-danger">L</th>
                      <th className="text-center">GD</th>
                      <th className="text-center pe-4">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.username} onClick={() => navigate(`/team/${row.username}/matches`)} style={{ cursor: "pointer" }}>
                        <td className="ps-4 fw-bold">{row.rank}</td>
                        <td className="fw-bold text-info">{row.display_name}</td>
                        <td className="text-center opacity-50">{row.tournaments_played}</td>
                        <td className="text-center opacity-50">{row.mp}</td>
                        <td className="text-center text-success opacity-75">{row.w}</td>
                        <td className="text-center text-danger opacity-75">{row.l}</td>
                        <td className="text-center opacity-75">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className="text-center pe-4 fw-black text-warning">
                          {row.win_rate}%
                        </td>
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
      <div className="text-center py-3 px-4" style={{ fontSize: "0.7rem", color: "#64748b", maxWidth: "900px", margin: "0 auto" }}>
        <strong>Disclaimer:</strong> This platform is an independent fan-operated initiative and is not officially affiliated with, authorized, maintained, sponsored, or endorsed by KONAMI, its subsidiaries, affiliates, licensors, or any related entities. All tournament registrations, team management features, and community activities are organized solely by independent player communities. Any references to KONAMI products, brands, or intellectual property are for identification purposes only and do not imply any official connection or endorsement. We operate as a passionate fan-driven service dedicated to enhancing the gaming community experience.
      </div>
    </div>
  );
};

export default KenyaEfootballHub;