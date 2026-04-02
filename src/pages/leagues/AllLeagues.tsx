import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";

export default function Leagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    const { data, error } = await supabase
      .from("leagues")
      .select("id, name, organizer, short_intro, country, season, avatar_url");

    if (error) {
      console.error(error);
    } else {
      setLeagues(data);
    }
  };

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami">
      <LeaguesNavbar />

      <div className="container-fluid px-4 mt-4">
        {/* Table Header */}
        <div className="konami-table-header d-none d-md-flex row mx-0 align-items-center py-2 px-3">
          <div className="col-md-6 small fw-bold tracking-widest text-primary-glow text-uppercase">Leagues</div>
          <div className="col-md-2 small fw-bold tracking-widest text-primary-glow text-center text-uppercase">Region</div>
          <div className="col-md-2 small fw-bold tracking-widest text-primary-glow text-center text-uppercase">Season</div>
          <div className="col-md-2 small fw-bold tracking-widest text-primary-glow text-end text-uppercase">Organizer</div>
        </div>

        {leagues.map((league) => (
          <div
            key={league.id}
            className="konami-row row mx-0 align-items-center py-3 px-3"
            onClick={() => navigate(`/league/${league.id}`)}
          >
            {/* League Info */}
            <div className="col-md-6 d-flex align-items-center">
              <div className="avatar-frame me-3">
                <img
                  src={league.avatar_url || "/cup.png"}
                  alt=""
                  className="konami-img"
                  onError={(e) => { e.currentTarget.src = "/cup.png" }}
                />
              </div>
              <div>
                <h6 className="m-0 text-uppercase italic fw-bold">{league.name}</h6>
                <div className="small text-konami-blue">{league.short_intro || ""}</div>
              </div>
            </div>

            {/* Region */}
            <div className="col-md-2 text-center text-uppercase small">
              {league.country || ""}
            </div>

            {/* Season */}
            <div className="col-md-2 text-center text-uppercase small italic text-info">
              {league.season || ""}
            </div>

            {/* Organizer Tag */}
            <div className="col-md-2 text-end">
              <span className="konami-badge">
                {league.organizer || "OFFICIAL"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        :root {
          --konami-bg: #030a1a;
          --konami-row-bg: rgba(13, 110, 253, 0.03);
          --konami-border: #0d6efd;
          --konami-blue-text: #58a6ff;
        }

        .bg-konami-dark {
          background-color: var(--konami-bg);
          background-image: radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
        }

        .text-primary-glow {
          color: var(--konami-blue-text);
        }

        .text-konami-blue { color: var(--konami-blue-text); }
        .italic { font-style: italic; }
        .tracking-widest { letter-spacing: 2px; }

        .konami-table-header {
          border-bottom: 2px solid var(--konami-border);
          background: rgba(13, 110, 253, 0.1);
        }

        .konami-row {
          background: var(--konami-row-bg);
          cursor: pointer;
          border-bottom: 1px solid rgba(13, 110, 253, 0.08);
          transition: background 0.15s ease-in-out;
        }

        .konami-row:hover {
          background: rgba(13, 110, 253, 0.1);
        }

        .avatar-frame {
          width: 40px;
          height: 40px;
          border: 1px solid var(--konami-border);
          transform: skew(-10deg);
          overflow: hidden;
          background: #000;
          flex-shrink: 0;
        }

        .konami-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: skew(10deg) scale(1.1);
        }

        .konami-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 12px;
          border: 1px solid var(--konami-border);
          color: var(--konami-border);
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
          display: inline-block;
        }
      `}</style>
    </div>
  );
}