import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isFei = location.pathname === "/fie" || location.pathname.startsWith("/fie/");

  useEffect(() => {
    if (!isFei) return;

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFei]);

  // ────────────────────────────────────────────────
  // FEI MODE – matches the provided Header UI/UX
  // ────────────────────────────────────────────────
  if (isFei) {
    return (
      <nav
        style={{
          width: "100%",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "linear-gradient(135deg, #38b222, #ff9f1c)",
          color: "#111",
          padding: "14px 20px",
          textAlign: "center",
          fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          boxShadow: scrolled
            ? "0 10px 30px rgba(0,0,0,0.15)"
            : "0 0 0 rgba(0,0,0,0)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {/* HUD scanline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(rgba(255,255,255,0.07) 50%, rgba(0,0,0,0.05) 50%)",
            backgroundSize: "100% 4px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Top title */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            letterSpacing: "3px",
            color: "#1a1a2e",
            opacity: 0.85,
            position: "relative",
            zIndex: 3,
          }}
        >
          FEDERATION INTERNATIONALE
        </div>

        {/* Main line with animated chevrons */}
        <div
          style={{
            marginTop: "4px",
            fontSize: "16px",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            position: "relative",
            zIndex: 3,
          }}
        >
          <i
            className="bi bi-chevron-left"
            style={{
              fontSize: "16px",
              opacity: 0.75,
              transform: scrolled ? "translateX(-25px)" : "translateX(0px)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
          <i className="bi bi-soccer-ball" style={{ fontSize: "16px", opacity: 0.8 }} />
          <span style={{ fontWeight: 900, color: "#1a1a2e" }}>EFOOTBALL</span>
          <i className="bi bi-soccer-ball" style={{ fontSize: "16px", opacity: 0.8 }} />
          <i
            className="bi bi-chevron-right"
            style={{
              fontSize: "16px",
              opacity: 0.75,
              transform: scrolled ? "translateX(25px)" : "translateX(0px)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>

        {/* Bottom left text – fades on scroll */}
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "20px",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#1a1a2e",
            letterSpacing: "1px",
            opacity: scrolled ? 0 : 0.6,
            transition: "opacity 0.25s ease",
            pointerEvents: "none",
            zIndex: 3,
          }}
        >
          Results & Competitions
        </div>

        {/* Navigation links (kept functional, styled to fit FEI) */}
        <div
          className="d-flex justify-content-center flex-wrap gap-2 mt-3"
          style={{ position: "relative", zIndex: 3 }}
        >
          <FeiNavLink to="/" label="Home" currentPath={location.pathname} />
          <FeiNavLink
            to="/activetournaments"
            label="Active Tournaments"
            currentPath={location.pathname}
          />
          <FeiNavLink to="/fie" label="FEI" currentPath={location.pathname} />
          <FeiNavLink
            to="/register"
            label="Register for Tournaments"
            currentPath={location.pathname}
          />
        </div>
      </nav>
    );
  }

  // ────────────────────────────────────────────────
  // DEFAULT MODE – original white navbar
  // ────────────────────────────────────────────────
  return (
    <nav
      className="navbar fixed-top bg-white border-bottom shadow-sm"
      style={{ borderColor: "#e0eafc" }}
    >
      <div className="container-fluid px-3 px-md-4 px-lg-5">
        <div className="d-flex align-items-center w-100">
          {/* Brand / Logo */}
          <Link
            to="/"
            className="navbar-brand fw-bold text-decoration-none me-3 me-lg-4 flex-shrink-0 brand-logo"
            style={{
              fontSize: "1.75rem",
              letterSpacing: "-0.5px",
              background: "linear-gradient(90deg, #0072ff, #00c6ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textTransform: "lowercase",
            }}
          >
            efootball
          </Link>

          {/* Navigation Links */}
          <div
            className="d-flex align-items-center flex-nowrap overflow-auto flex-grow-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <style>{`
              .overflow-auto::-webkit-scrollbar { display: none; }
              .brand-logo:hover { opacity: 0.85; }
              .custom-nav-link {
                font-size: 0.9rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                padding: 0.45rem 1rem;
                margin: 0 0.2rem;
                transition: all 0.2s ease-in-out;
                border-radius: 6px;
                color: #556987;
                text-decoration: none;
                border: 1px solid transparent;
              }
              .custom-nav-link:hover:not(.active) {
                color: #0072ff !important;
                background-color: #f0f7ff;
              }
              .custom-nav-link.active {
                background-color: #e6f0ff !important;
                color: #0072ff !important;
                border-color: #b3d4ff !important;
                font-weight: 700;
              }
              @media (max-width: 576px) {
                .navbar-brand { font-size: 1.5rem !important; }
                .custom-nav-link { font-size: 0.8rem; padding: 0.35rem 0.75rem; }
              }
            `}</style>

            <NavLink to="/" label="Home" currentPath={location.pathname} />
            <NavLink
              to="/activetournaments"
              label="Active Tournaments"
              currentPath={location.pathname}
            />
            <NavLink to="/fie" label="FEI" currentPath={location.pathname} />
            <NavLink
              to="/register"
              label="Register for Tournaments"
              currentPath={location.pathname}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ─── Helpers ─────────────────────────────────────── */

function NavLink({
  to,
  label,
  currentPath,
}: {
  to: string;
  label: string;
  currentPath: string;
}) {
  const isActive =
    currentPath === to || (to !== "/" && currentPath.startsWith(to + "/"));
  return (
    <Link
      to={to}
      className={`custom-nav-link text-nowrap ${isActive ? "active" : ""}`}
      style={{ minWidth: "fit-content" }}
    >
      {label}
    </Link>
  );
}

function FeiNavLink({
  to,
  label,
  currentPath,
}: {
  to: string;
  label: string;
  currentPath: string;
}) {
  const isActive =
    currentPath === to || (to !== "/" && currentPath.startsWith(to + "/"));

  return (
    <Link
      to={to}
      className="text-nowrap"
      style={{
        fontSize: "0.75rem",
        fontWeight: isActive ? 800 : 700,
        letterSpacing: "1px",
        textTransform: "uppercase",
        padding: "0.3rem 0.85rem",
        borderRadius: "4px",
        textDecoration: "none",
        color: "#1a1a2e",
        background: isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)",
        border: isActive
          ? "1px solid rgba(0,0,0,0.15)"
          : "1px solid transparent",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </Link>
  );
}