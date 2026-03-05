import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  // State for language toggle: true = French, false = English
  const [isFrench, setIsFrench] = useState(true);

  const toggleLanguage = () => setIsFrench(!isFrench);

  return (
    <nav className="navbar fixed-top bg-black border-bottom border-primary shadow-lg" style={{ borderBottomWidth: '2px' }}>
      <div className="container-fluid px-3 px-md-4 px-lg-5">
        <div className="d-flex align-items-center w-100">

          {/* Brand */}
          <Link
            className="navbar-brand fw-black text-decoration-none me-3 me-lg-4 flex-shrink-0"
            to="/dashboard"
            style={{
              fontSize: '1.9rem',
              letterSpacing: '-1px',
              background: 'linear-gradient(90deg, #0d6efd, #20c997, #fd7e14)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'lowercase'
            }}
          >
            efootball
          </Link>

          {/* Scrollable Nav Links */}
          <div
            className="d-flex align-items-center flex-nowrap overflow-auto flex-grow-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <style>{`
              .overflow-auto::-webkit-scrollbar { display: none; }
              
              .nav-link {
                font-size: 0.95rem;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                padding: 0.5rem 1.2rem;
                margin: 0 0.25rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 8px;
                border: 1px solid transparent;
              }

              .nav-link:hover:not(.active) {
                color: #fff !important;
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(13, 110, 253, 0.3);
              }

              .active {
                background: rgba(13, 110, 253, 0.1) !important;
                color: #0d6efd !important;
                border: 1px solid #0d6efd !important;
                font-weight: 700;
                box-shadow: inset 0 0 10px rgba(13, 110, 253, 0.2);
              }

              .lang-toggle-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #fff;
                font-weight: 800;
                font-size: 0.75rem;
                padding: 0.4rem 0.8rem;
                border-radius: 4px;
                letter-spacing: 1px;
                transition: all 0.2s ease;
                min-width: 45px;
              }

              .lang-toggle-btn:hover {
                background: #0d6efd;
                border-color: #0d6efd;
                transform: scale(1.05);
              }

              @media (max-width: 576px) {
                .navbar-brand { font-size: 1.6rem !important; }
                .nav-link { font-size: 0.85rem; padding: 0.4rem 0.9rem; }
              }
            `}</style>

            <NavLink to="/dashboard" label={isFrench ? "Accueil" : "Home"} currentPath={location.pathname} />
            <NavLink to="/teams" label={isFrench ? "Tournois" : "Tournaments"} currentPath={location.pathname} />
            <NavLink to="/leaderboard" label={isFrench ? "Classement" : "Leaderboard"} currentPath={location.pathname} />
            <NavLink to="/register" label={isFrench ? "S'inscrire" : "Register"} currentPath={location.pathname} />
            <NavLink to="/account" label={isFrench ? "Compte" : "Account"} currentPath={location.pathname} />
          </div>

          {/* Language Toggle - Far Right */}
          <div className="ms-3 flex-shrink-0">
            <button 
              onClick={toggleLanguage}
              className="lang-toggle-btn text-uppercase"
              title={isFrench ? "Switch to English" : "Passer en Français"}
            >
              {isFrench ? "FR" : "EN"}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, currentPath }) {
  const isActive =
    currentPath === to ||
    (to !== "/dashboard" && currentPath.startsWith(to + "/"));

  return (
    <Link
      to={to}
      className={`nav-link text-nowrap ${isActive ? 'active' : 'text-white-50'}`}
      style={{
        minWidth: 'fit-content',
      }}
    >
      {label}
    </Link>
  );
}