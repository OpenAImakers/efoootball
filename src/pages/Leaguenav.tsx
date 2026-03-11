import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LeaguesNavbar() {
  const location = useLocation();

  // Check if current path is precisely /leagues to highlight the active tab
  const isLeaguesActive = location.pathname === "/leagues";

  return (
    <nav className="sticky-top bg-black border-bottom border-primary shadow-lg" style={{ zIndex: 1050, borderBottomWidth: '2px' }}>
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center justify-content-between" style={{ height: '65px' }}>
          
          {/* Left Side: Brand Name */}
          <div className="d-flex align-items-center">
            <h4 className="mb-0 fw-black text-white text-uppercase italic-style tracking-tighter">
              Leagues<span className="text-primary">.hub</span>
            </h4>
          </div>

          {/* Right Side: Navigation Tabs */}
          <div className="d-flex h-100 align-items-center">
            <Link 
              to="/leagues" 
              className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase transition-all ${
                isLeaguesActive ? "text-primary border-bottom border-primary" : "text-white-50 hover-white"
              }`}
              style={{ fontSize: '0.85rem', letterSpacing: '1px', borderBottomWidth: '3px !important' }}
            >
              <i className="bi bi-trophy-fill me-2"></i>
              Leagues
            </Link>
          </div>

        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .italic-style { font-style: italic; }
        .tracking-tighter { letter-spacing: -1.5px; }
        .transition-all { transition: all 0.3s ease; }
        
        .hover-white:hover {
          color: white !important;
          background: rgba(255, 255, 255, 0.05);
        }

        /* Specific style for active state glow */
        .text-primary {
          text-shadow: 0 0 10px rgba(13, 110, 253, 0.3);
        }
      `}</style>
    </nav>
  );
}