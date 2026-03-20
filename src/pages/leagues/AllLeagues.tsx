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
    <div className="min-vh-100 bg-white text-dark">
      <LeaguesNavbar />

      <div className="container-fluid px-3 mt-3">
        {leagues.length === 0 && (
          <div className="text-center py-5 text-muted">
            No active leagues found.
          </div>
        )}

        {leagues.map((league) => (
          <div
            key={league.id}
            className="league-card mb-4 p-4 d-flex align-items-center"
            onClick={() => navigate(`/league/${league.id}`)}
          >
            <div className="d-flex align-items-center me-4">
              <img
                src={league.avatar_url || "/cup.png"}
                alt="League Icon"
                className="league-icon"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/60?text=🏆' }}
              />
              <span className="followers-text ms-2">1.1k followers</span>
            </div>
            <div className="flex-grow-1">
              <h4 className="league-name mb-1">{league.name.toUpperCase()}</h4>
              <small className="league-info text-muted">
                {league.short_intro || "No description"} • {league.country || "Unknown"} • {league.season || "Season TBD"}
              </small>
            </div>
            <div className="ms-3 text-end">
              <span className="organizer-tag">{league.organizer || "OFFICIAL"}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .league-card {
          width: 100%;
          background: #fff;
          border-radius: 15px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .league-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }

        .league-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #dee2e6;
        }

        .followers-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0d6efd;
        }

        .league-name {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .league-info {
          font-size: 0.85rem;
        }

        .organizer-tag {
          font-size: 0.85rem;
          font-weight: 700;
          color: #6c757d;
          text-transform: uppercase;
          background: #e9ecef;
          padding: 4px 12px;
          border-radius: 20px;
          transition: all 0.2s ease;
        }

        .league-card:hover .organizer-tag {
          background: #0d6efd;
          color: white;
        }
      `}</style>
    </div>
  );
}