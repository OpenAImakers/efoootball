import React from "react";
import LeaguesNavbar from "./Leaguenav"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

export default function SpecificLeague() {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 w-100 bg-black text-white d-flex flex-column">
      {/* 1. Navbar at the top */}
      <LeaguesNavbar />

      {/* 2. Under Construction Strip */}
      <div className="w-100 py-1 bg-primary text-center" style={{ fontSize: '0.7rem', letterSpacing: '4px' }}>
        <span className="fw-black text-white text-uppercase">League Details under development</span>
      </div>

      <div className="container-fluid px-4 py-4 flex-grow-1">
        {/* 3. Header Section */}
        <div className="d-flex align-items-center mb-4">
          <button onClick={() => navigate("/leagues")} className="btn text-white p-0 border-0 me-3">
            <i className="bi bi-arrow-left" style={{ fontSize: "1.8rem" }}></i>
          </button>
          <div>
            <h1 className="fw-black text-uppercase italic-style mb-0">Nairobi Premier League</h1>
            <span className="text-primary fw-bold">Official Tournament Series</span>
          </div>
        </div>

        <div className="row g-4">
          {/* 4. Statistics Cards */}
          <div className="col-12 col-md-4">
            <div className="p-4 rounded-4 border border-primary border-2 bg-white text-black h-100 shadow-lg">
              <h5 className="fw-black text-uppercase border-bottom pb-2 mb-3">League Stats</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted fw-bold">Active Players</span>
                <span className="fw-black text-primary">124</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted fw-bold">Total Matches</span>
                <span className="fw-black">1,402</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted fw-bold">Admins</span>
                <span className="badge bg-primary text-white">4 Online</span>
              </div>
              <hr />
            </div>
          </div>

          {/* 5. Ongoing Tournaments (Cups) */}
          <div className="col-12 col-md-8">
            <div className="p-4 rounded-4 border border-primary border-2 bg-white text-black shadow-lg h-100">
              <h5 className="fw-black text-uppercase border-bottom pb-2 mb-3">Ongoing Cups</h5>
              
              <div className="list-group list-group-flush">
                <div className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center bg-transparent">
                  <div>
                    <h6 className="fw-black mb-1">Kanairo Champions Cup</h6>
                    <span className="badge bg-success text-uppercase" style={{ fontSize: '0.6rem' }}>Live - Round 16</span>
                  </div>
                  <button className="btn btn-primary btn-sm rounded-pill fw-black px-3">SPECTATE</button>
                </div>

                <div className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center bg-transparent">
                  <div>
                    <h6 className="fw-black mb-1">Eastlands Pro Knockout</h6>
                    <span className="badge bg-warning text-dark text-uppercase" style={{ fontSize: '0.6rem' }}>Registration Open</span>
                  </div>
                  <button className="btn btn-outline-dark btn-sm rounded-pill fw-black px-3">REGISTER</button>
                </div>

                <div className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center bg-transparent border-0">
                  <div>
                    <h6 className="fw-black mb-1">Super 8 League</h6>
                    <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.6rem' }}>Starting Tomorrow</span>
                  </div>
                  <button className="btn btn-dark btn-sm rounded-pill fw-black px-3" disabled>VIEW BRACKET</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Admin Panel / Info Strip */}
        <div className="mt-4 p-3 rounded-4 bg-primary text-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
                <i className="bi bi-shield-check fs-3 me-3"></i>
                <div>
                    <div className="fw-black text-uppercase" style={{ lineHeight: 1 }}>League Verified</div>
                    <small>This tournament is eFootball™ Season 2026 Compliant</small>
                </div>
            </div>
            <button className="btn btn-light btn-sm fw-black rounded-pill px-4">CONTACT ADMIN</button>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .italic-style { font-style: italic; letter-spacing: -1.5px; }
        .bg-white { background-color: #ffffff !important; }
        
        .list-group-item {
          border-color: #eee !important;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          h1 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}