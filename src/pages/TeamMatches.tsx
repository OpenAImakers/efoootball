import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

const TeamMatches = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ w: 0, d: 0, l: 0, gf: 0, ga: 0 });

  useEffect(() => {
    const fetchTeamDataAndMatches = async () => {
      setLoading(true);
      try {
        const { data: teamData } = await supabase
          .from("teams")
          .select("id")
          .eq("name", username)
          .single();

        if (teamData) {
          const { data } = await supabase
            .from("matches")
            .select(`
              *,
              home:home_team_id(name),
              away:away_team_id(name)
            `)
            .or(`home_team_id.eq.${teamData.id},away_team_id.eq.${teamData.id}`)
            .order("created_at", { ascending: false });

          const results = data || [];
          setMatches(results);

          // Calculate Quick Stats
          let w = 0, d = 0, l = 0, gf = 0, ga = 0;
          results.filter(m => m.played).forEach(m => {
            const isHome = m.home?.name === username;
            const uG = isHome ? m.home_goals : m.away_goals;
            const oG = isHome ? m.away_goals : m.home_goals;
            gf += uG; ga += oG;
            if (uG > oG) w++;
            else if (uG < oG) l++;
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

  return (
    <div className="min-vh-100 bg-white flex-column d-flex">
      <Navbar />
      
      {/* Header Banner */}
      <div className="bg-light border-bottom py-5 mt-5">
        <div className="container">
          <button className="btn btn-sm btn-outline-secondary rounded-pill mb-3" onClick={() => navigate(-1)}>
            ← Leaderboard
          </button>
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div>
              <h1 className="display-5 fw-bold text-primary mb-0">{username}</h1>
              <p className="text-muted text-uppercase fw-semibold mb-0" style={{ letterSpacing: '1px' }}>Team Dashboard</p>
            </div>
            
            {/* Stats Grid */}
            <div className="d-flex gap-4 mt-3 mt-lg-0">
              <div className="text-center">
                <div className="h4 fw-bold mb-0">{stats.w + stats.d + stats.l}</div>
                <small className="text-muted">Played</small>
              </div>
              <div className="text-center">
                <div className="h4 fw-bold mb-0 text-success">{stats.w}</div>
                <small className="text-muted">Wins</small>
              </div>
              <div className="text-center border-start ps-4">
                <div className="h4 fw-bold mb-0">{stats.gf}</div>
                <small className="text-muted">GF</small>
              </div>
              <div className="text-center">
                <div className="h4 fw-bold mb-0 text-danger">{stats.ga}</div>
                <small className="text-muted">GA</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <h4 className="fw-bold mb-4">Match Results & Fixtures</h4>
        
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : (
          <div className="table-responsive shadow-sm rounded border">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Date</th>
                  <th className="text-end">Home</th>
                  <th className="text-center">Result</th>
                  <th>Away</th>
                  <th>Stage</th>
                  <th className="text-center pe-4">Form</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const isHome = match.home?.name === username;
                  const userGoals = isHome ? match.home_goals : match.away_goals;
                  const oppGoals = isHome ? match.away_goals : match.home_goals;
                  
                  let formCircle = { label: '-', class: 'bg-light text-muted' };
                  if (match.played) {
                    if (userGoals > oppGoals) formCircle = { label: 'W', class: 'bg-success text-white' };
                    else if (userGoals < oppGoals) formCircle = { label: 'L', class: 'bg-danger text-white' };
                    else formCircle = { label: 'D', class: 'bg-secondary text-white' };
                  }

                  return (
                    <tr key={match.id}>
                      <td className="ps-4 text-muted small">
                        {new Date(match.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      <td className={`text-end ${isHome ? 'fw-bold text-primary' : ''}`}>
                        {match.home?.name}
                      </td>
                      <td className="text-center">
                        <div className="d-inline-block px-3 py-1 rounded bg-dark text-white font-monospace fw-bold" style={{ fontSize: '0.9rem', minWidth: '60px' }}>
                          {match.played ? `${match.home_goals} - ${match.away_goals}` : 'VS'}
                        </div>
                      </td>
                      <td className={!isHome ? 'fw-bold text-primary' : ''}>
                        {match.away?.name || "TBD"}
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-uppercase" style={{ fontSize: '0.65rem' }}>
                          {match.stage?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-center pe-4">
                        <div className={`form-indicator ${formCircle.class}`}>
                          {formCircle.label}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table thead th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; padding: 15px; }
        .table tbody td { padding: 18px 15px; border-bottom: 1px solid #f0f0f0; }
        .form-indicator {
          width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.7rem; fw-bold;
        }
        .bg-primary-subtle { background-color: #eef4ff !important; color: #0d6efd !important; }
        .font-monospace { letter-spacing: 1px; }
      `}</style>
    </div>
  );
};

export default TeamMatches;