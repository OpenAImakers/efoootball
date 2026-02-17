"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { Team } from "../pages/Team"; // Adjust path as needed

export default function SingleEliminationLayout({ 
  tournament, 
  teams 
}: { 
  tournament: any, 
  teams: Team[] 
}) {
  return (
    <div className="container-fluid py-4">
      {/* HEADER SECTION */}
      <div className="text-center mb-5">
        <h2 className="text-warning fw-bold text-uppercase tracking-wider">
          {tournament.name.replace(/_/g, " ")}
        </h2>
        <span className="badge rounded-pill bg-warning text-dark">Single Elimination</span>
      </div>

      {/* TABS NAVIGATION */}
      <ul className="nav nav-tabs border-secondary mb-4 justify-content-center" id="singleElimTab" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active text-white border-0 bg-transparent px-4" id="teams-tab" data-bs-toggle="tab" data-bs-target="#teams-pane" type="button" role="tab">
            Teams
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link text-white border-0 bg-transparent px-4" id="bracket-tab" data-bs-toggle="tab" data-bs-target="#bracket-pane" type="button" role="tab">
            Bracket
          </button>
        </li>
      </ul>

      {/* TAB CONTENT */}
      <div className="tab-content" id="singleElimTabContent">
        
        {/* TEAMS LIST PANE */}
        <div className="tab-pane fade show active" id="teams-pane" role="tabpanel" tabIndex={0}>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="table-responsive bg-dark border border-warning rounded-4 overflow-hidden shadow-lg">
                <table className="table table-dark table-hover mb-0 align-middle">
                  <thead className="bg-warning">
                    <tr>
                      <th className="text-dark ps-4 py-3">#</th>
                      <th className="text-dark py-3">Participating Team</th>
                      <th className="text-dark text-center py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.length > 0 ? (
                      teams.map((team, index) => (
                        <tr key={team.id} className="border-secondary">
                          <td className="ps-4 text-muted">{index + 1}</td>
                          <td className="fw-bold">{team.name}</td>
                          <td className="text-center">
                            <span className="badge bg-outline-warning border border-warning text-warning small">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-muted">
                          No teams registered for this tournament yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* BRACKET PANE (COMING SOON) */}
        <div className="tab-pane fade" id="bracket-pane" role="tabpanel" tabIndex={0}>
          <div className="text-center py-5 bg-dark border border-warning border-dashed rounded-4 shadow-lg mx-auto" style={{maxWidth: '700px'}}>
             <div className="display-4 text-warning mb-3">
               <i className="bi bi-diagram-3"></i> 🏆
             </div>
             <h3 className="text-warning">Bracket Visualizer</h3>
             <p className="text-muted">
               We are currently generating the seeds for the **Single Elimination** bracket. 
               Check back shortly to see the matchups!
             </p>
          </div>
        </div>

      </div>

      <style>{`
        .nav-tabs .nav-link.active {
          border-bottom: 3px solid #ffc107 !important;
          font-weight: bold;
          opacity: 1;
        }
        .nav-tabs .nav-link {
          opacity: 0.5;
          transition: 0.3s;
        }
        .nav-tabs .nav-link:hover {
          opacity: 1;
        }
        .tracking-wider {
          letter-spacing: 2px;
        }
        .border-dashed {
          border-style: dashed !important;
        }
      `}</style>
    </div>
  );
}