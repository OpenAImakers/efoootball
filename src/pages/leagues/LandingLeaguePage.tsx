import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";
import { loginToLeague } from "../../Utils/LeagueSesssion";
import { useNavigate } from "react-router-dom";

export default function LeagueOperations() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [passkeys, setPasskeys] = useState({}); // Track passkey inputs per league

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

  const handleInputChange = (id: number, value: string) => {
    setPasskeys((prev) => ({ ...prev, [id]: value }));
  };

  const handleManageLeague = (league: any) => {
    const entered = passkeys[league.id] || "";
    // Simple check: match passkey (plain text) or allow if empty
    if (league.passkey && league.passkey !== entered) {
      return alert("Incorrect passkey!");
    }

    loginToLeague(league.id, league.name);
    navigate("/manage-league");
  };

  return (
    <div className="min-vh-100 w-100 bg-white">
      <LeaguesNavbar />

      {/* Page Header */}
      <div className="w-100 border-bottom px-4 py-3">
        <h4 className="fw-bold m-0">League Operations</h4>
      </div>

      {/* Operations */}
      <div className="w-100 px-4 py-3">
        <div className="list-group w-100">

          {/* Add League */}
          <div
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center w-100"
            onClick={() => navigate("/add-league")}
            style={{ cursor: "pointer" }}
          >
            <span className="d-flex align-items-center">
              <i className="bi bi-plus-circle me-3 text-primary fs-5"></i>
              Add New League
            </span>
            <i className="bi bi-chevron-right text-muted"></i>
          </div>

          {/* Manage Existing Leagues */}
          {leagues.map((league: any) => (
            <div key={league.id} className="list-group-item w-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">{league.name}</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleManageLeague(league)}
                >
                  Manage
                </button>
              </div>
              {league.passkey && (
                <input
                  type="password"
                  placeholder="Enter passkey"
                  className="form-control form-control-sm"
                  value={passkeys[league.id] || ""}
                  onChange={(e) => handleInputChange(league.id, e.target.value)}
                />
              )}
            </div>
          ))}

        </div>
      </div>

      <style>{`
        .list-group-item{
          padding:15px 20px;
          border-left:none;
          border-right:none;
          margin-bottom:8px;
        }
        .list-group-item:hover{
          background:#f8fbff;
        }
      `}</style>
    </div>
  );
}