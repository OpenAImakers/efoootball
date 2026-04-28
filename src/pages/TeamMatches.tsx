"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const TeamMatches = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  const [userTeamIds, setUserTeamIds] = useState([]);

  useEffect(() => {
    const fetchTeamDataAndMatches = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, teams(id)")
          .eq("username", username)
          .single();

        if (profileData && profileData.teams) {
          const teamIds = profileData.teams.map(t => t.id);
          setUserTeamIds(teamIds);

          const { data } = await supabase
            .from("matches")
            .select(`
              *,
              home:home_team_id(name),
              away:away_team_id(name)
            `)
            .or(`home_team_id.in.(${teamIds.join(",")}),away_team_id.in.(${teamIds.join(",")})`)
            .order("created_at", { ascending: false });

          const results = data || [];
          setMatches(results);

          let w = 0, d = 0, l = 0, gf = 0, ga = 0;
          results.filter(m => m.played).forEach(m => {
            const isHome = teamIds.includes(m.home_team_id);
            const userGoals = isHome ? m.home_goals : m.away_goals;
            const opponentGoals = isHome ? m.away_goals : m.home_goals;

            gf += userGoals ?? 0;
            ga += opponentGoals ?? 0;

            if (userGoals > opponentGoals) w++;
            else if (userGoals < opponentGoals) l++;
            else d++;
          });

          setStats({ w, d, l, gf, ga });
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchTeamDataAndMatches();
  }, [username]);

  const getResult = (match) => {
    if (!match.played) return { text: "-", className: "text-muted" };

    const isHome = userTeamIds.includes(match.home_team_id);
    const userG = isHome ? match.home_goals : match.away_goals;
    const oppG = isHome ? match.away_goals : match.home_goals;

    if (userG > oppG) return { text: "W", className: "badge bg-success-subtle text-success border border-success-subtle" };
    if (userG < oppG) return { text: "L", className: "badge bg-danger-subtle text-danger border border-danger-subtle" };
    return { text: "D", className: "badge bg-secondary-subtle text-secondary border border-secondary-subtle" };
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#fdfdfd" }}>

      {/* ✅ HEADER */}
      <div className="position-fixed top-0 start-0 w-100 shadow-sm" style={{ backgroundColor: "#020617", zIndex: 1000 }}>
        <div className="container d-flex align-items-center py-3">
          <button
            className="btn btn-link text-white text-decoration-none p-0 me-3"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-chevron-left fs-4"></i>
          </button>

          <h2 className="mb-0 fw-bold text-white h5 text-uppercase tracking-wider">
            {username}
            <span className="fw-light opacity-50 ms-2 small">/ History</span>
          </h2>
        </div>
      </div>

      <div className="container mt-4" style={{ paddingTop: "85px" }}>

        {/* ✅ STATS CARDS */}
        <div className="row g-2 mb-4">
          {[
            { label: "Wins", val: stats.w, color: "text-success" },
            { label: "Losses", val: stats.l, color: "text-danger" },
            { label: "Draws", val: stats.d, color: "text-muted" },
            { label: "GD", val: stats.gf - stats.ga, color: "text-primary" },
          ].map((stat, i) => (
            <div key={i} className="col-3">
              <div className="p-2 py-3 bg-white rounded-3 border-0 shadow-sm text-center">
                <div className="text-muted mb-1" style={{ fontSize: '0.6rem', fontWeight: '800', letterSpacing: '1px' }}>
                  {stat.label.toUpperCase()}
                </div>
                <div className={`h5 mb-0 fw-bold ${stat.color}`}>{stat.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ MATCH LIST */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3 px-1">
            <h6 className="fw-bold m-0 text-dark">Recent Results</h6>
            <div className="small text-muted">{matches.length} matches</div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary opacity-50" role="status" /></div>
          ) : (
            <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
              <table className="table table-hover align-middle mb-0">
                <tbody>
                  {matches.length === 0 ? (
                    <tr><td className="text-center py-5 text-muted italic">No match records found.</td></tr>
                  ) : (
                    matches.map((match) => {
                      const isHome = userTeamIds.includes(match.home_team_id);
                      const result = getResult(match);

                      return (
                        <tr key={match.id} className="border-bottom">
                          <td className="ps-3" style={{ width: '60px' }}>
                            <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: '600' }}>
                              {new Date(match.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </td>
                          
                          <td className={`text-end pe-2 ${isHome ? 'fw-bold text-dark' : 'text-muted'}`} style={{ fontSize: '0.9rem' }}>
                            {match.home?.name || "TBD"}
                          </td>
                          
                          <td className="text-center" style={{ width: '90px' }}>
                            <div className={`d-inline-block px-2 py-1 rounded-2 fw-bold font-monospace ${match.played ? 'bg-dark text-white' : 'bg-light text-muted'}`} style={{ fontSize: '0.8rem' }}>
                              {match.played ? `${match.home_goals}-${match.away_goals}` : 'VS'}
                            </div>
                          </td>
                          
                          <td className={`text-start ps-2 ${!isHome ? 'fw-bold text-dark' : 'text-muted'}`} style={{ fontSize: '0.9rem' }}>
                            {match.away?.name || "TBD"}
                          </td>

                          <td className="text-end pe-3" style={{ width: '50px' }}>
                            <span className={result.className} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                              {result.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');
        
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .table > :not(caption) > * > * { border-bottom-width: 0; }
        .tracking-wider { letter-spacing: 0.1em; }
        .bg-success-subtle { background-color: #e8f5e9 !important; }
        .bg-danger-subtle { background-color: #ffebee !important; }
        .bg-secondary-subtle { background-color: #f5f5f5 !important; }
      `}</style>
    </div>
  );
};

export default TeamMatches;