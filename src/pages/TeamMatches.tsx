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
  
  // State tracking which match's details are currently expanded
  const [expandedMatchId, setExpandedMatchId] = useState(null);

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
    if (!match.played) return { text: "-", className: "text-muted bg-light" };

    const isHome = userTeamIds.includes(match.home_team_id);
    const userG = isHome ? match.home_goals : match.away_goals;
    const oppG = isHome ? match.away_goals : match.home_goals;

    if (userG > oppG) return { text: "W", className: "bg-success text-white" };
    if (userG < oppG) return { text: "L", className: "bg-danger text-white" };
    return { text: "D", className: "bg-secondary text-white" };
  };

  const toggleExpandMatch = (matchId) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  // EPL Style Chart Row Generator using pure high-contrast fluid bars
  const renderStatBar = (label, homeVal, awayVal, suffix = "") => {
    const h = parseFloat(homeVal) || 0;
    const a = parseFloat(awayVal) || 0;
    const total = h + a;
    
    // Proportional widths
    const homePercent = total > 0 ? (h / total) * 100 : 50;
    const awayPercent = total > 0 ? (a / total) * 100 : 50;

    return (
      <div className="mb-3 px-1">
        <div className="d-flex justify-content-between align-items-center mb-1 small fw-bold text-dark" style={{ fontSize: '0.8rem' }}>
          <span>{homeVal !== null ? `${homeVal}${suffix}` : "-"}</span>
          <span className="text-uppercase text-muted tracking-wider" style={{ fontSize: '0.65rem' }}>{label}</span>
          <span>{awayVal !== null ? `${awayVal}${suffix}` : "-"}</span>
        </div>
        <div className="progress rounded-pill bg-light-subtle border" style={{ height: "6px" }}>
          <div 
            className="progress-bar bg-dark rounded-start-pill transition-all" 
            style={{ width: `${homePercent}%` }}
          />
          <div 
            className="progress-bar bg-warning rounded-end-pill transition-all" 
            style={{ width: `${awayPercent}%`, marginLeft: 'auto' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8fafc" }}>

      {/* HEADER */}
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
           
          </h2>
        </div>
      </div>

      <div className="container mt-4" style={{ paddingTop: "85px" }}>

        {/* STATS CARDS */}
        <div className="row g-2 mb-4">
          {[
            { label: "Wins", val: stats.w, color: "text-success" },
            { label: "Losses", val: stats.l, color: "text-danger" },
            { label: "Draws", val: stats.d, color: "text-muted" },
            { label: "GD", val: stats.gf - stats.ga, color: "text-primary" },
          ].map((stat, i) => (
            <div key={i} className="col-3">
              <div className="p-2 py-3 bg-white rounded-3 border shadow-sm text-center">
                <div className="text-muted mb-1" style={{ fontSize: '0.6rem', fontWeight: '800', letterSpacing: '1px' }}>
                  {stat.label.toUpperCase()}
                </div>
                <div className={`h5 mb-0 fw-bold ${stat.color}`}>{stat.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MATCH LIST SECTION */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3 px-1">
            <h6 className="fw-bold m-0 text-dark">Ranking Matches</h6>
            <div className="small text-muted fw-semibold">{matches.length}</div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark opacity-50" role="status" />
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-4 border p-5 text-center text-muted italic shadow-sm">
              No match records found.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {matches.map((match) => {
                const isHome = userTeamIds.includes(match.home_team_id);
                const result = getResult(match);
                const isExpanded = expandedMatchId === match.id;

                return (
                  <div 
                    key={match.id} 
                    className={`bg-white rounded-4 border shadow-sm overflow-hidden transition-all duration-200 ${isExpanded ? 'border-dark ring-1' : ''}`}
                  >
                    {/* Main Row summary (Clickable toggler) */}
                    <div 
                      className="p-3 d-flex align-items-center cursor-pointer select-none position-relative match-row-header"
                      onClick={() => toggleExpandMatch(match.id)}
                    >
                      {/* Left Badge: Result indicator status */}
                      <div className="me-3">
                        <span 
                          className={`d-flex align-items-center justify-content-center rounded-circle font-monospace fw-bold`} 
                          style={{ width: '28px', height: '28px', fontSize: '0.75rem', ...(match.played ? {} : {background: '#f1f5f9', color: '#64748b'}) }}
                        >
                          <div className={`w-100 h-100 rounded-circle d-flex align-items-center justify-content-center ${result.className}`}>
                            {result.text}
                          </div>
                        </span>
                      </div>

                      {/* Team vs Team Layout */}
                      <div className="d-flex flex-grow-1 align-items-center justify-content-between">
                        <div className={`text-end flex-grow-1 pe-3 ${isHome ? 'fw-bold text-dark' : 'text-muted'}`} style={{ width: '40%', fontSize: '0.9rem' }}>
                          {match.home?.name || "TBD"}
                        </div>

                        {/* Middle Core Score Block */}
                        <div className="text-center" style={{ width: '75px' }}>
                          <div className={`px-2 py-1 rounded-2 fw-bold font-monospace ${match.played ? 'bg-dark text-white shadow-sm' : 'bg-light text-muted border'}`} style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            {match.played ? `${match.home_goals}-${match.away_goals}` : 'VS'}
                          </div>
                          <div className="text-muted mt-1" style={{ fontSize: '0.55rem', fontWeight: '700' }}>

                             {match.home_ht_goals !== null ? match.home_ht_goals : 0} - {match.away_ht_goals !== null ? match.away_ht_goals : 0}
                          </div>
                        </div>

                        <div className={`text-start flex-grow-1 ps-3 ${!isHome ? 'fw-bold text-dark' : 'text-muted'}`} style={{ width: '40%', fontSize: '0.9rem' }}>
                          {match.away?.name || "TBD"}
                        </div>
                      </div>

                      {/* Right Indicator Arrow */}
                      <div className="ms-2 text-muted opacity-50">
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} fs-6`}></i>
                      </div>
                    </div>

                    {/* Collapsible Analytis Drawer */}
                    {isExpanded && (
                      <div className="border-top bg-white p-3 match-details-drawer">
                        {match.played ? (
                          <div>

                            {/* Dashboard Stats Graph Rows */}
                            {renderStatBar("Possession", match.home_possession, match.away_possession, "%")}
                            {renderStatBar("Shots", match.home_shots, match.away_shots)}
                            {renderStatBar("Shots on Target", match.home_shots_on_target, match.away_shots_on_target)}
                            {renderStatBar("Passes Completed", match.home_successful_passes, match.away_successful_passes)}
                            {renderStatBar("Total Passes Attempted", match.home_passes, match.away_passes)}
                            {renderStatBar("Tackles Made", match.home_tackles, match.away_tackles)}
                            {renderStatBar("Interceptions", match.home_interceptions, match.away_interceptions)}
                            {renderStatBar("Saves", match.home_saves, match.away_saves)}
                            {renderStatBar("Corner Kicks", match.home_corner_kicks, match.away_corner_kicks)}
                            {renderStatBar("Crosses", match.home_crosses, match.away_crosses)}
                            {renderStatBar("Fouls", match.home_fouls, match.away_fouls)}
                            {renderStatBar("Offsides", match.home_offsides, match.away_offsides)}
                            {renderStatBar("Free Kicks", match.home_free_kicks, match.away_free_kicks)}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted small italic">
                            <i className="bi bi-calendar-event me-2"></i>
                            This match has not been played yet. Detailed dashboard analytics will configure once stats are submitted.
                          </div>
                        )}
                        
                        {/* Meta Timestamp Footer */}
                        <div className="text-center mt-3 pt-2 border-top text-muted" style={{ fontSize: '0.6rem', fontWeight: '600' }}>
                          {new Date(match.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');
        
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .tracking-wider { letter-spacing: 0.08em; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.2s ease-in-out; }
        
        .match-row-header:hover {
          background-color: #f8fafc;
        }
        
        /* Smooth pop-in animation for stats dashboard */
        .match-details-drawer {
          animation: slideDown 0.2s ease-out forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TeamMatches;