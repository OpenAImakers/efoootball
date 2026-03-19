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
      .select("id, name, organizer");

    if (error) {
      console.error(error);
    } else {
      setLeagues(data);
    }
  };

  return (
    <div className="min-vh-100 bg-white text-dark">
      <LeaguesNavbar />

      <div className="container-fluid px-0 mt-2">
        <div className="table-responsive w-100">
          <table className="table custom-league-table w-100 m-0">
            <thead>
              <tr>
                <th className="ps-4">LEAGUE</th>
                <th className="text-end pe-4">ORGANIZER</th>
              </tr>
            </thead>
            <tbody>
              {leagues.map((league) => (
                <tr
                  key={league.id}
                  onClick={() => navigate(`/league/${league.id}`)}
                  className="league-row"
                >
                  <td className="ps-4 align-middle">
                    <div className="d-flex align-items-center gap-3">
                      <div className="league-icon-wrapper">
                        <img 
                          src="/cup.png" 
                          alt="League Icon" 
                          className="league-icon"
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40?text=🏆' }} 
                        />
                      </div>
                      <div className="d-flex flex-column">
                        <span className="league-name fw-bold">
                          {league.name.toUpperCase()}
                        </span>
                        {/* Modified: Always visible, icon changed to 'info' */}
                        <small className="clickable-hint">
                          <i className="bi bi-info-circle-fill me-1"></i> About League
                        </small>
                      </div>
                    </div>
                  </td>
                  <td className="text-end pe-4 align-middle">
                    <div className="d-flex flex-column align-items-end">
                      <span className="organizer-tag">
                        {league.organizer || "OFFICIAL"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {!leagues.length && (
                <tr>
                  <td colSpan={2} className="text-center py-5 text-muted">
                    No active leagues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .custom-league-table {
          border-collapse: separate;
          border-spacing: 0;
          background: white;
        }

        .custom-league-table thead th {
          background: #f8f9fa;
          color: #0d6efd;
          font-size: 0.7rem;
          letter-spacing: 1.5px;
          padding: 12px 15px;
          border-bottom: 2px solid #0d6efd;
          text-transform: uppercase;
        }

        .league-row {
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          border-bottom: 1px solid #eee;
        }

        .league-row td {
          padding: 16px 15px;
          border: none;
        }

        .league-icon-wrapper {
          width: 42px;
          height: 42px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .league-icon {
          width: 70%;
          height: 70%;
          object-fit: contain;
        }

        .league-name {
          font-size: 1rem;
          color: #212529;
          line-height: 1.2;
        }

        /* Modified: Default state is now visible with light gray color */
        .clickable-hint {
          font-size: 0.65rem;
          color: #888;
          font-weight: 600;
          text-transform: uppercase;
          transition: all 0.2s ease;
          margin-top: 2px;
        }

        /* Modified: Turn blue only on hover */
        .league-row:hover .clickable-hint {
          color: #0d6efd;
        }

        .organizer-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6c757d;
          text-transform: uppercase;
          background: #e9ecef;
          padding: 2px 10px;
          border-radius: 20px;
          transition: all 0.2s ease;
        }

        .league-row:hover .organizer-tag {
          background: #0d6efd;
          color: white;
        }
      `}</style>
    </div>
  );
}