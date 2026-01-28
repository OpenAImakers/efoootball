"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

interface Team {
  id: string;
  name: string;
  w: number;
  d: number;
  l: number;
  points: number;
  gd: number;
  rank: number;
}

// Fixed: Moved outside the component so it has a stable reference.
// This prevents the ESLint 'missing dependency' error and infinite loops.
const ALL_TABLES = ["teamsranked", "teamgroup1", "teamgroup2", "teamgroup3", "teamgroup4"];

export default function Teams() {
  const [groups, setGroups] = useState<{ [key: string]: Team[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const fetchedData: { [key: string]: Team[] } = {};

        await Promise.all(
          ALL_TABLES.map(async (table) => {
            const { data, error } = await supabase
              .from(table)
              .select("*")
              .order("points", { ascending: false });

            if (error) throw error;
            fetchedData[table] = data || [];
          })
        );

        setGroups(fetchedData);
      } catch (err: any) {
        setError("Failed to load standings.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []); // Empty dependency array is now valid because ALL_TABLES is external

return (
  <main className="mt-5 bg-black text-white min-vh-100">
    <Navbar />

    <div className="container py-5">
      {/* Stepper with flowing gradient to match logo shards */}
      <div className="mb-5">
        <ul className="d-flex justify-content-between align-items-center px-0" style={{ listStyle: 'none', gap: '8px' }}>
          {[
            { num: '1', label: 'Groups', active: true },
            { num: '2', label: 'Quarter', active: false },
            { num: '3', label: 'Semi', active: false },
            { num: '4', label: 'Final', active: false },
            { num: '5', label: '3rd Place', active: false },
            { num: '🏆', label: 'Standings', active: false },
          ].map((step, idx) => (
            <li key={idx} className="text-center flex-fill d-flex flex-column align-items-center" style={{ minWidth: '60px' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center border border-2"
                style={{
                  width: '48px',
                  height: '48px',
                  background: step.active ? 'linear-gradient(135deg, #0d6efd, #fd7e14)' : '#212529',
                  borderColor: '#0d6efd',
                  color: step.active ? 'white' : '#0d6efd',
                }}
              >
                <span className="fw-bold">{step.num}</span>
              </div>
              <div className="mt-2 small" style={{ color: step.active ? '#0d6efd' : '#6c757d' }}>
                {step.label}
              </div>
              {idx < 5 && (
                <div
                  className="position-absolute w-100"
                  style={{
                    height: '3px',
                    background: 'linear-gradient(to right, #0d6efd, #20c997, #fd7e14)',
                    top: '22px',
                    zIndex: -1,
                    marginLeft: 'calc(50% + 30px)',
                    width: 'calc(100% - 60px)',
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Scrollable tabs – pills style, horizontal scroll on mobile */}
      <div className="mb-4">
        <ul
          className="nav nav-pills flex-nowrap overflow-auto text-nowrap border-bottom border-primary pb-3"
          id="tournamentTabs"
          role="tablist"
          style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
        >
          <li className="nav-item me-2" role="presentation">
            <button
              className="nav-link active rounded-pill px-4 py-2"
              id="group-tab"
              data-bs-toggle="pill"
              data-bs-target="#group"
              type="button"
              role="tab"
              aria-controls="group"
              aria-selected="true"
              style={{ background: 'linear-gradient(45deg, #0d6efd, #20c997)', color: 'white' }}
            >
              Group Stage
            </button>
          </li>
          <li className="nav-item me-2" role="presentation">
            <button
              className="nav-link rounded-pill px-4 py-2"
              id="quarter-tab"
              data-bs-toggle="pill"
              data-bs-target="#quarter"
              type="button"
              role="tab"
              aria-controls="quarter"
              style={{ border: '1px solid #fd7e14', color: '#fd7e14' }}
            >
              Quarter-finals
            </button>
          </li>
          <li className="nav-item me-2" role="presentation">
            <button
              className="nav-link rounded-pill px-4 py-2"
              id="semi-tab"
              data-bs-toggle="pill"
              data-bs-target="#semi"
              type="button"
              role="tab"
              aria-controls="semi"
              style={{ border: '1px solid #20c997', color: '#20c997' }}
            >
              Semi-finals
            </button>
          </li>
          <li className="nav-item me-2" role="presentation">
            <button
              className="nav-link rounded-pill px-4 py-2"
              id="final-tab"
              data-bs-toggle="pill"
              data-bs-target="#final"
              type="button"
              role="tab"
              aria-controls="final"
              style={{ border: '1px solid #0d6efd', color: '#0d6efd' }}
            >
              Final
            </button>
          </li>
          <li className="nav-item me-2" role="presentation">
            <button
              className="nav-link rounded-pill px-4 py-2"
              id="third-tab"
              data-bs-toggle="pill"
              data-bs-target="#third"
              type="button"
              role="tab"
              aria-controls="third"
              style={{ border: '1px solid #fd7e14', color: '#fd7e14' }}
            >
              Third Place
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link rounded-pill px-4 py-2"
              id="results-tab"
              data-bs-toggle="pill"
              data-bs-target="#results"
              type="button"
              role="tab"
              aria-controls="results"
              style={{ border: '1px solid #6610f2', color: '#6610f2' }}
            >
              Final Standings
            </button>
          </li>
        </ul>
      </div>

      {/* Tab content – no hover effects, solid & grounded */}
      <div className="tab-content" id="tournamentTabContent">
        <div className="tab-pane fade show active" id="group" role="tabpanel" aria-labelledby="group-tab">
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary spinner-border-lg"></div>
            </div>
          ) : error ? (
            <div className="alert alert-danger border-primary">{error}</div>
          ) : (
            ALL_TABLES.map((table) => (
              <div key={table} className="mb-5 bg-dark border border-primary border-opacity-50 rounded shadow-sm">
                <div className="p-3 fw-bold text-uppercase" style={{ background: 'linear-gradient(90deg, #0d6efd33, transparent)', color: '#0d6efd' }}>
                  {table === "teamsranked" ? "Overall Standings" : `Group ${table.slice(-1)}`}
                </div>
                <div className="table-responsive">
                  <table className="table table-dark table-bordered mb-0 align-middle">
                    <thead className="bg-primary text-black">
                      <tr>
                        <th className="text-center">Rank</th>
                        <th>Team Name</th>
                        <th className="text-center">W</th>
                        <th className="text-center">D</th>
                        <th className="text-center">L</th>
                        <th className="text-center">PTS</th>
                        <th className="text-center">GD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups[table]?.map((team) => (
                        <tr key={team.id}>
                          <td className="text-center fw-bold">{team.rank}</td>
                          <td>{team.name}</td>
                          <td className="text-center">{team.w}</td>
                          <td className="text-center">{team.d}</td>
                          <td className="text-center">{team.l}</td>
                          <td className="text-center fw-bold" style={{ color: '#fd7e14' }}>{team.points}</td>
                          <td className="text-center">{team.gd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Other tabs – placeholders with theme-matched colors */}
        <div className="tab-pane fade text-center py-5" id="quarter" role="tabpanel" aria-labelledby="quarter-tab">
          <h3 style={{ color: '#fd7e14' }}>Quarter-finals – Knockout Ignites</h3>
          <p className="lead text-muted">The real battle begins. Winners advance...</p>
        </div>

        <div className="tab-pane fade text-center py-5" id="semi" role="tabpanel" aria-labelledby="semi-tab">
          <h3 style={{ color: '#20c997' }}>Semi-finals – One Step from the Final</h3>
          <p className="lead text-muted">High tension. Four teams remain...</p>
        </div>

        <div className="tab-pane fade text-center py-5" id="final" role="tabpanel" aria-labelledby="final-tab">
          <h3 style={{ color: '#0d6efd' }}>The Grand Final – Glory Awaits</h3>
          <p className="lead text-muted">The pinnacle of the tournament.</p>
        </div>

        <div className="tab-pane fade text-center py-5" id="third" role="tabpanel" aria-labelledby="third-tab">
          <h3 style={{ color: '#fd7e14' }}>Third Place Play-off</h3>
          <p className="lead text-muted">Bronze on the line – pride & prestige.</p>
        </div>

        <div className="tab-pane fade text-center py-5" id="results" role="tabpanel" aria-labelledby="results-tab">
          <h3 style={{ color: '#6610f2' }}>Final Standings – Champion Crowned</h3>
          <p className="lead text-muted">Full rankings, top scorer, MVP & more...</p>
        </div>
      </div>
    </div>

    {/* Optional global styles – put in your CSS file */}
    <style>{`
      .nav-pills .nav-link {
        transition: all 0.2s ease;
      }
      .nav-pills .nav-link.active {
        background: linear-gradient(45deg, #0d6efd, #20c997, #fd7e14) !important;
        color: white !important;
      }
      .overflow-auto::-webkit-scrollbar {
        height: 6px;
      }
      .overflow-auto::-webkit-scrollbar-thumb {
        background: #0d6efd;
        border-radius: 10px;
      }
    `}</style>
  </main>
);
}