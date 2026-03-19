import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LeaguesNavbar() {
  const location = useLocation();

  return (
    <nav className="sticky-top border-bottom border-primary shadow-lg" style={{ zIndex: 1050, background: "#000" }}>
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center" style={{ height: "65px" }}>
          
          <Link
            to="/leagues"
            className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase transition-all ${
              location.pathname === "/leagues"
                ? "text-primary border-bottom border-primary border-3"
                : "text-white-50 nav-link-hover"
            }`}
          >
            Leagues
          </Link>

          <Link
            to="/dashboard"
            className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase transition-all ${
              location.pathname === "/dashboard"
                ? "text-primary border-bottom border-primary border-3"
                : "text-white-50 nav-link-hover"
            }`}
          >
            Home
          </Link>

          <Link
            to="/leaguelandingpage"
            className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase transition-all ${
              location.pathname === "/leaguelandingpage"
                ? "text-primary border-bottom border-primary border-3"
                : "text-white-50 nav-link-hover"
            }`}
          >
            Manage
          </Link>

        </div>
      </div>

      <style>{`
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        
        .nav-link-hover:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05);
        }

        .text-primary {
          color: #0d6efd !important;
          text-shadow: 0 0 10px rgba(13, 110, 253, 0.4);
        }

        .border-3 {
          border-bottom-width: 3px !important;
        }
      `}</style>
    </nav>
  );
}