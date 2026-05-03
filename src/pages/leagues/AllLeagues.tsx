"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";

const BRAND = {
  WHITE: "#FFFFFF",
  BLACK: "#000000",
  LIGHT_GRAY: "#F5F5F5",
  MID_GRAY: "#E0E0E0",
  DARK_GRAY: "#333333"
};

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
    <div className="min-vh-100 pb-5" style={{ backgroundColor: BRAND.LIGHT_GRAY }}>
      <LeaguesNavbar />
      <div className="container-fluid px-4" style={{marginTop: "20px"}}>
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border" style={{ color: BRAND.BLACK }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {leagues.map((league) => (
              <div key={league.id} className="col-12 col-md-6 col-xl-4 col-xxl-3">
                <div 
                  className="league-card"
                  onClick={() => navigate(`/league/${league.id}`)}
                >
                  {/* Top Bar: Season & Region */}
                  <div className="card-header-info d-flex justify-content-between p-3">
                    <span className="season-tag">{league.season || "S1"}</span>
                    <span className="region-tag">{league.country || "KENYA"}</span>
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

                    <h4 className="league-title mb-1">
                      {league.name}
                    </h4>
                    <p className="league-intro">
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
        /* League Card Styling */
        .league-card {
          position: relative;
          background: ${BRAND.WHITE};
          border: 1px solid ${BRAND.MID_GRAY};
          border-radius: 16px;
          height: 100%;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .league-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          border-color: ${BRAND.BLACK};
        }

        .league-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: ${BRAND.BLACK};
          border-radius: 16px 0 0 16px;
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
          background: ${BRAND.LIGHT_GRAY};
          border: 2px solid ${BRAND.BLACK};
          border-radius: 20px;
          transform: rotate(45deg);
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: rotate(-45deg) scale(1.4);
          transition: transform 0.5s ease;
        }

        .league-card:hover .card-img {
          transform: rotate(-45deg) scale(1.5);
        }

        /* Tags */
        .season-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          background: ${BRAND.BLACK};
          color: ${BRAND.WHITE};
          border-radius: 20px;
          letter-spacing: 0.5px;
        }

        .region-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          background: ${BRAND.DARK_GRAY};
          color: ${BRAND.WHITE};
          border-radius: 20px;
          letter-spacing: 0.5px;
        }

        .league-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: ${BRAND.BLACK};
          text-transform: uppercase;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .league-intro {
          font-size: 0.8rem;
          color: ${BRAND.DARK_GRAY};
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
          height: 2.8em;
          margin-top: 8px;
        }

        .card-footer-terminal {
          background: ${BRAND.LIGHT_GRAY};
          border-top: 1px solid ${BRAND.MID_GRAY};
          margin-top: auto;
        }

        .tiny-label {
          font-size: 0.6rem;
          color: ${BRAND.DARK_GRAY};
          letter-spacing: 1px;
          font-weight: 700;
        }

        .organizer-name {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: ${BRAND.BLACK};
          font-weight: 700;
        }

        .card-action-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${BRAND.BLACK};
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .league-card:hover .card-action-icon {
          background: ${BRAND.DARK_GRAY};
          transform: translateX(3px);
        }

        .card-action-icon i {
          color: ${BRAND.WHITE};
          font-size: 0.9rem;
        }

        /* Loading Animation */
        .spinner-border {
          width: 50px;
          height: 50px;
          border-width: 3px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .card-avatar-hex {
            width: 80px;
            height: 80px;
          }
          
          .league-title {
            font-size: 1rem;
          }
          
          .league-intro {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}