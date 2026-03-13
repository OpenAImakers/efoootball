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

  const RenderTable = ({ data }: { data: any[] }) => (
    <div className="table-responsive shadow-sm rounded border bg-white">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th className="ps-4">Date</th>
            <th className="text-end">Home</th>
            <th className="text-center">Result</th>
            <th>Away</th>
            <th className="pe-4 text-center">Stage</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-5 text-muted">No matches found in this category.</td></tr>
          ) : (
            data.map((match) => {
              const isHome = match.home?.name === username;
              return (
                <tr key={match.id}>
                  <td className="ps-4 text-muted small">
                    {new Date(match.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={`text-end ${isHome ? 'fw-bold text-primary' : ''}`}>
                    {match.home?.name}
                  </td>
                  <td className="text-center">
                    <div className="d-inline-block px-3 py-1 rounded bg-dark text-white font-monospace fw-bold" style={{ fontSize: '0.85rem', minWidth: '65px' }}>
                      {match.played ? `${match.home_goals} - ${match.away_goals}` : 'VS'}
                    </div>
                  </td>
                  <td className={!isHome ? 'fw-bold text-primary' : ''}>
                    {match.away?.name || "TBD"}
                  </td>
                  <td className="text-center pe-4">
                    <span className="badge bg-light text-primary border border-primary-subtle text-uppercase" style={{ fontSize: '0.65rem' }}>
                      {match.stage?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      {/* Sub-Header with Back Button */}
      <div className="bg-white border-bottom py-3 shadow-sm" style={{ marginTop: "100px" }}>
        <div className="container d-flex align-items-center">
          <button className="btn btn-outline-secondary btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center me-3" 
                  style={{ width: '32px', height: '32px' }} 
                  onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
          </button>
          <h2 className="mb-0 fw-bold h4">{username} <span className="text-muted fw-normal fs-6 ms-2">| Match History</span></h2>
        </div>
      </div>

      {/* Stats Quick-View */}
      <div className="container mt-4">
        <div className="row g-3">
          {[
            { label: "Won", val: stats.w, color: "text-success" },
            { label: "Lost", val: stats.l, color: "text-danger" },
            { label: "GF", val: stats.gf, color: "text-dark" },
            { label: "GA", val: stats.ga, color: "text-dark" }
          ].map((stat, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="p-3 bg-white rounded border shadow-sm text-center">
                <div className="text-muted small text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>{stat.label}</div>
                <div className={`h4 mb-0 fw-bold ${stat.color}`}>{stat.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Selection */}
        <div className="mt-4">
          <ul className="nav nav-pills nav-justified mb-3 bg-white p-1 rounded shadow-sm border" role="tablist">
            <li className="nav-item">
              <button className="nav-link active fw-bold" data-bs-toggle="pill" data-bs-target="#played">Played</button>
            </li>
            <li className="nav-item">
              <button className="nav-link fw-bold" data-bs-toggle="pill" data-bs-target="#upcoming">Upcoming</button>
            </li>
          </ul>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="tab-content pb-5">
              <div className="tab-pane fade show active" id="played">
                <RenderTable data={matches.filter(m => m.played)} />
              </div>
              <div className="tab-pane fade" id="upcoming">
                <RenderTable data={matches.filter(m => !m.played)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        body { background-color: #f8f9fa !important; }
        .nav-pills .nav-link { color: #6c757d; border-radius: 6px; padding: 10px; transition: 0.2s; }
        .nav-pills .nav-link.active { background-color: #0d6efd !important; color: white !important; }
        .table thead th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 15px; border-top: none; }
        .table tbody td { padding: 18px 15px; }
      `}</style>
    </div>
  );
};

export default TeamMatches;