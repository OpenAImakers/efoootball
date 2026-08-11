import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LivelyFeed from "./LivelyFeed";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll position state
  const [scrolled, setScrolled] = useState(false);

  // PWA / Standalone Installation Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Safely cast navigator for non-standard iOS Safari property to satisfy TypeScript
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;

    if (standalone) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleManageTournament = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }

    navigate("/auth");
  };

  return (
    <header className={`fixed-top header-wrapper ${scrolled ? "header-scrolled" : ""}`}>
      {/* Top Glassmorphic Navigation Bar */}
      <nav className="navbar-container">
        <div className="container-fluid px-3 px-md-4 px-lg-5">
          <div className="d-flex align-items-center justify-content-between w-100 py-2 navbar-inner">
            
            {/* Brand / Logo (Takes to Home) */}
            <Link to="/" className="navbar-brand-premium flex-shrink-0">
              <span className="brand-glow"></span>
              <span className="brand-text">efootball</span>
            </Link>

            {/* Navigation Links */}
            <div className="nav-scroll-container mx-3">
              <NavLink to="/activetournaments" label="Tournaments" currentPath={location.pathname} />
              <NavLink to="/fie" label="FIE" currentPath={location.pathname} />
              <NavLink to="/register" label="Register" currentPath={location.pathname} />
              {/* to fixtures
               */}
              <NavLink to="/about" label="Fixtures" currentPath={location.pathname} />
            </div>

            {/* Manage Tournament / PWA Action CTA */}
            {!isStandalone && (
              <button className="cta-btn-glass text-nowrap" onClick={handleManageTournament}>
                <i className="bi bi-trophy-fill me-2"></i>
                <span>Manage Tournament</span>
              </button>
            )}

          </div>
        </div>
      </nav>

      {/* Lively Feed Section - Smoothly hides on scroll */}
      <div className="lively-feed-wrapper">
        <LivelyFeed />
      </div>

      {/* High-End Styling */}
      <style>{`
        .header-wrapper {
          z-index: 1030;
          background: rgba(3, 10, 26, 0.85);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-scrolled {
          background: rgba(2, 6, 18, 0.95);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        }

        .navbar-container {
          position: relative;
          background: radial-gradient(circle at 20% 0%, rgba(13, 110, 253, 0.15) 0%, transparent 50%);
        }

        .navbar-inner {
          transition: padding 0.3s ease;
        }

        .header-scrolled .navbar-inner {
          padding-top: 0.25rem !important;
          padding-bottom: 0.25rem !important;
        }

        .navbar-brand-premium {
          position: relative;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          padding: 0.2rem 0;
        }

        .brand-text {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.8px;
          text-transform: lowercase;
          background: linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: all 0.3s ease;
        }

        .header-scrolled .brand-text {
          font-size: 1.4rem;
        }

        .navbar-brand-premium:hover .brand-text {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .nav-scroll-container {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .nav-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .nav-link-premium {
          position: relative;
          font-size: 0.825rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          padding: 0.55rem 1.1rem;
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid transparent;
        }

        .header-scrolled .nav-link-premium {
          padding: 0.35rem 0.85rem;
          font-size: 0.775rem;
        }

        .nav-link-premium:hover:not(.active) {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .nav-link-premium.active {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.3);
          box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.15);
        }

        .cta-btn-glass {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 1.2rem;
          font-size: 0.825rem;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .header-scrolled .cta-btn-glass {
          padding: 0.35rem 0.9rem;
          font-size: 0.75rem;
        }

        .cta-btn-glass:hover {
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.3), rgba(255, 255, 255, 0.1));
          border-color: rgba(56, 189, 248, 0.5);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(13, 110, 253, 0.25);
        }

        /* Lively Feed Smooth Collapse Animation */
        .lively-feed-wrapper {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
          max-height: 50px;
          opacity: 1;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s ease,
                      padding 0.35s ease;
          padding: 6px 0;
        }

        .header-scrolled .lively-feed-wrapper {
          max-height: 0;
          opacity: 0;
          padding: 0;
          border-top-color: transparent;
        }

        @media (max-width: 576px) {
          .brand-text { font-size: 1.5rem; }
          .header-scrolled .brand-text { font-size: 1.2rem; }
          .nav-link-premium { font-size: 0.75rem; padding: 0.45rem 0.8rem; }
          .cta-btn-glass { font-size: 0.75rem; padding: 0.45rem 0.85rem; }
        }
      `}</style>
    </header>
  );
}

function NavLink({ to, label, currentPath }: { to: string; label: string; currentPath: string }) {
  const isActive = currentPath === to || (to !== "/" && currentPath.startsWith(to + "/"));
  return (
    <Link
      to={to}
      className={`nav-link-premium text-nowrap ${isActive ? "active" : ""}`}
    >
      {label}
    </Link>
  );
}