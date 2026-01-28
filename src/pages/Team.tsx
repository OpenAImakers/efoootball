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

const ALL_TABLES = ["teamsranked", "teamgroup1", "teamgroup2", "teamgroup3", "teamgroup4"];

export default function Teams() {
  const [groups, setGroups] = useState<{ [key: string]: Team[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedData: { [key: string]: Team[] } = {};

        await Promise.all(
          ALL_TABLES.map(async (table) => {
            const { data, error: fetchError } = await supabase
              .from(table)
              .select("*")
              .order("points", { ascending: false });

            if (fetchError) throw fetchError;
            fetchedData[table] = data || [];
          })
        );

        setGroups(fetchedData);
      } catch (err: any) {
        setError("Failed to load standings. Please check your connection.");
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <main className="mt-5 bg-black text-white min-vh-100 overflow-hidden">
      <Navbar />

      <div className="container py-5">
        {/* Stepper Section */}
        <div className="mb-5 px-2">
          <ul
            className="d-flex justify-content-between align-items-center px-0 position-relative"
            style={{ listStyle: "none", gap: "8px", maxWidth: "100%" }}
          >
            {[
              { num: "1", label: "Groups", active: true },
              { num: "2", label: "Quarter", active: false },
              { num: "3", label: "Semi", active: false },
              { num: "4", label: "Final", active: false },
              { num: "5", label: "3rd Place", active: false },
              { num: "🏆", label: "Standings", active: false },
            ].map((step, idx) => (
              <li
                key={idx}
                className="text-center flex-fill d-flex flex-column align-items-center position-relative"
                style={{ minWidth: "50px", zIndex: 1 }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center border border-2"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: step.active
                      ? "linear-gradient(135deg, #0d6efd, #fd7e14)"
                      : "#212529",
                    borderColor: "#0d6efd",
                    color: step.active ? "white" : "#0d6efd",
                  }}
                >
                  <span className="fw-bold" style={{ fontSize: "0.9rem" }}>
                    {step.num}
                  </span>
                </div>
                <div
                  className="mt-2 small fw-semibold"
                  style={{ fontSize: "0.75rem", color: step.active ? "#0d6efd" : "#6c757d" }}
                >
                  {step.label}
                </div>

                {idx < 5 && (
                  <div
                    className="position-absolute"
                    style={{
                      height: "2px",
                      background: "linear-gradient(to right, #0d6efd, #fd7e14)",
                      top: "22px",
                      left: "calc(50% + 22px)",
                      width: "calc(100% - 44px)",
                      zIndex: -1,
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Scrollable tabs */}
        <div className="mb-4">
          <ul
            className="nav nav-pills flex-nowrap overflow-auto text-nowrap border-bottom border-primary pb-3"
            id="tournamentTabs"
            role="tablist"
            style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
          >
            <li className="nav-item me-2" role="presentation">
              <button className="nav-link active rounded-pill px-4 py-2" id="group-tab" data-bs-toggle="pill" data-bs-target="#group" type="button" role="tab" style={{ background: "linear-gradient(45deg, #0d6efd, #20c997)", color: "white" }}>Group Stage</button>
            </li>
            <li className="nav-item me-2" role="presentation">
              <button className="nav-link rounded-pill px-4 py-2" id="quarter-tab" data-bs-toggle="pill" data-bs-target="#quarter" type="button" role="tab" style={{ border: "1px solid #fd7e14", color: "#fd7e14" }}>Quarter-finals</button>
            </li>
            <li className="nav-item me-2" role="presentation">
              <button className="nav-link rounded-pill px-4 py-2" id="semi-tab" data-bs-toggle="pill" data-bs-target="#semi" type="button" role="tab" style={{ border: "1px solid #20c997", color: "#20c997" }}>Semi-finals</button>
            </li>
            <li className="nav-item me-2" role="presentation">
              <button className="nav-link rounded-pill px-4 py-2" id="final-tab" data-bs-toggle="pill" data-bs-target="#final" type="button" role="tab" style={{ border: "1px solid #0d6efd", color: "#0d6efd" }}>Final</button>
            </li>
            <li className="nav-item me-2" role="presentation">
              <button className="nav-link rounded-pill px-4 py-2" id="third-tab" data-bs-toggle="pill" data-bs-target="#third" type="button" role="tab" style={{ border: "1px solid #fd7e14", color: "#fd7e14" }}>Third Place</button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link rounded-pill px-4 py-2" id="results-tab" data-bs-toggle="pill" data-bs-target="#results" type="button" role="tab" style={{ border: "1px solid #6610f2", color: "#6610f2" }}>Final Standings</button>
            </li>
          </ul>
        </div>

        {/* Tab content */}
        <div className="tab-content" id="tournamentTabContent">
          {/* GROUP STAGE TAB */}
          <div className="tab-pane fade show active" id="group" role="tabpanel" aria-labelledby="group-tab">
            {loading ? (
              <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>
            ) : error ? (
              <div className="alert alert-danger bg-dark text-danger border-danger my-4 text-center">{error}</div>
            ) : (
              ALL_TABLES.map((table) => (
                <div key={table} className="mb-5 bg-dark border border-primary border-opacity-25 rounded overflow-hidden shadow-sm">
                  <div className="p-3 fw-bold text-uppercase" style={{ background: "linear-gradient(90deg, #0d6efd22, transparent)", color: "#0d6efd" }}>
                    {table === "teamsranked" ? "Overall Standings" : `Group ${table.slice(-1)}`}
                  </div>
                  <div className="table-responsive">
                    <table className="table table-dark mb-0 align-middle">
                      <thead className="table-primary">
                        <tr>
                          <th className="text-center">Rank</th>
                          <th>Team</th>
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
                            <td className="text-center fw-bold" style={{ color: "#fd7e14" }}>{team.points}</td>
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

          {/* PLACEHOLDER TABS */}
          <div className="tab-pane fade" id="quarter" role="tabpanel" aria-labelledby="quarter-tab">
            <div className="text-center py-5 border border-primary border-opacity-25 rounded bg-dark">
              <h3 style={{ color: "#fd7e14" }}>Quarter-finals</h3>
              <p className="text-muted">Coming soon...</p>
            </div>
          </div>

          <div className="tab-pane fade" id="semi" role="tabpanel" aria-labelledby="semi-tab">
            <div className="text-center py-5 border border-primary border-opacity-25 rounded bg-dark">
              <h3 style={{ color: "#20c997" }}>Semi-finals</h3>
              <p className="text-muted">Coming soon...</p>
            </div>
          </div>

          <div className="tab-pane fade" id="final" role="tabpanel" aria-labelledby="final-tab">
            <div className="text-center py-5 border border-primary border-opacity-25 rounded bg-dark">
              <h3 style={{ color: "#0d6efd" }}>The Final</h3>
              <p className="text-muted">Coming soon...</p>
            </div>
          </div>

          <div className="tab-pane fade" id="third" role="tabpanel" aria-labelledby="third-tab">
            <div className="text-center py-5 border border-primary border-opacity-25 rounded bg-dark">
              <h3 style={{ color: "#fd7e14" }}>Third Place Play-off</h3>
              <p className="text-muted">Coming soon...</p>
            </div>
          </div>

          <div className="tab-pane fade" id="results" role="tabpanel" aria-labelledby="results-tab">
            <div className="text-center py-5 border border-primary border-opacity-25 rounded bg-dark">
              <h3 style={{ color: "#6610f2" }}>Final Standings</h3>
              <p className="text-muted">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nav-pills .nav-link { transition: all 0.2s ease; }
        .nav-pills .nav-link.active { background: linear-gradient(45deg, #0d6efd, #20c997, #fd7e14) !important; color: white !important; }
        .overflow-auto::-webkit-scrollbar { height: 4px; }
        .overflow-auto::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        body { overflow-x: hidden; }
      `}</style>
    </main>
  );
}