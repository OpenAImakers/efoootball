import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const TournamentDashboard = () => {
  // State to track which "tab" is active on the right
  const [activeTab, setActiveTab] = useState('rules');

  const tournament = {
    title: "Champions League",
    prize: "-",
    teamsCount: "-",
    rules: ["-"],
    teamsList: ["No teams registered yet."],
    schedule: ["Coming soon..."]
  };

  return (
    <div className="container-fluid w-100 bg-light min-vh-100 ">
      <div className="row ">
        
        {/* LEFT SIDE: THE FIXED CARD */}
        <div className="col-md-4 col-lg-3 mb-4">
          <div className="card shadow-sm border-0 " >
            <div className="bg-dark p-4 text-white">
              <h4 className="fw-bold">{tournament.title}</h4>
            </div>
            
            <div className="card-body">
              <div className="mb-4">
                <label className="text-muted small d-block">PRIZE POOL</label>
                <h5 className="fw-bold text-success">{tournament.prize}</h5>
              </div>

              {/* Navigation List */}
              <div className="list-group list-group-flush">
                <button 
                  onClick={() => setActiveTab('rules')}
                  className={`list-group-item list-group-item-action border-0 px-0 d-flex justify-content-between ${activeTab === 'rules' ? 'text-primary fw-bold' : ''}`}
                >
                  Tournament Rules <span>→</span>
                </button>
                <button 
                  onClick={() => setActiveTab('teams')}
                  className={`list-group-item list-group-item-action border-0 px-0 d-flex justify-content-between ${activeTab === 'teams' ? 'text-primary fw-bold' : ''}`}
                >
                  Registered Teams <span className="badge rounded-pill bg-light text-dark border">{tournament.teamsCount}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('schedule')}
                  className={`list-group-item list-group-item-action border-0 px-0 d-flex justify-content-between ${activeTab === 'schedule' ? 'text-primary fw-bold' : ''}`}
                >
                  Match Schedule <span>→</span>
                </button>
              </div>

              <button className="btn btn-primary w-100 mt-4 py-2 fw-bold">Participate</button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: SCROLLABLE CONTENT */}
        <div className="col-md-7 col-lg-9">
          <div className="bg-white p-5 shadow-sm" >
            
            {activeTab === 'rules' && (
              <div className="animate-fade-in">
                <h3 className="fw-bold mb-4">Official Rules</h3>
                <p className="text-muted">Please read the following guidelines carefully to avoid disqualification.</p>
                <ul className="list-group list-group-flush mt-3">
                  {tournament.rules.map((rule, i) => (
                    <li key={i} className="list-group-item border-0 ps-0">
                      <i className="bi bi-check-circle-fill text-primary me-2"></i> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="animate-fade-in">
                <h3 className="fw-bold mb-4">Registered Teams</h3>
                <div className="row g-3">
                  {tournament.teamsList.map((team, i) => (
                    <div key={i} className="col-6">
                      <div className="p-3 border rounded-3 bg-light d-flex align-items-center">
                        <div className="bg-secondary rounded-circle me-2" style={{width: '30px', height: '30px'}}></div>
                        <span className="fw-medium">{team}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="animate-fade-in">
                <h3 className="fw-bold mb-4">Event Timeline</h3>
                {tournament.schedule.map((item, i) => (
                  <div key={i} className="d-flex mb-4">
                    <div className="me-3 text-primary fw-bold">Step 0{i+1}</div>
                    <div className="border-start ps-3">
                      <h6 className="mb-0 fw-bold text-dark">{item.split(':')[0]}</h6>
                      <p className="text-muted small">{item.split(':')[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default TournamentDashboard;