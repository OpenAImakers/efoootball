import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LeaguesNavbar() {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/dashboard" },
    { name: "Leagues", path: "/leagues" },
    { name: "Manage", path: "/leaguelandingpage" },
  ];

  return (
    <nav className="sticky-top konami-nav shadow-lg">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center" style={{ height: "60px" }}>
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item-konami ${isActive ? "active" : ""}`}
              >
                <span className="nav-text">{item.name}</span>
                {isActive && <div className="active-indicator"></div>}
              </Link>
            );
          })}

        </div>
      </div>

      <style>{`
        .konami-nav {
          z-index: 1050;
          background: linear-gradient(180deg, #000000 0%, #030a1a 100%);
          border-bottom: 2px solid #0d6efd;
        }

        .nav-item-konami {
          text-decoration: none;
          padding: 0 25px;
          height: 100%;
          display: flex;
          align-items: center;
          position: relative;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 800;
          text-transform: uppercase;
          font-style: italic;
          letter-spacing: 1px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .nav-item-konami:hover {
          color: #ffffff;
          background: rgba(13, 110, 253, 0.1);
        }

        .nav-item-konami.active {
          color: #58a6ff;
          background: rgba(13, 110, 253, 0.05);
        }

        .nav-text {
          position: relative;
          z-index: 2;
        }

        .active-indicator {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 4px;
          background: #0d6efd;
          box-shadow: 0 0 15px rgba(13, 110, 253, 0.8);
          /* The Konami Slant */
          clip-path: polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%);
        }

        /* Subtle glow on the active text */
        .nav-item-konami.active .nav-text {
          text-shadow: 0 0 8px rgba(88, 166, 255, 0.5);
        }
      `}</style>
    </nav>
  );
}