import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar() {
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



  const handleMybets = async (e: React.MouseEvent) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    navigate(session ? "/mybets" : "/auth");
  };
  

  const handleDeposit = async (e: React.MouseEvent) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    navigate(session ? "/deposit" : "/auth");
  };

  return (
    <header className={`fixed-top header-wrapper ${scrolled ? "header-scrolled" : ""}`}>
      <nav className="navbar-container">
        <div className="container-fluid px-2 px-md-4 px-lg-5">
          <div className="d-flex align-items-center justify-content-between w-100 py-1 py-md-2 navbar-inner">
            {/* Brand / Logo */}
            <Link to="/" className="navbar-brand-premium flex-shrink-0">
              <span className="brand-glow"></span>
              <span className="brand-text">Rankings</span>
            </Link>

            {/* CTA Stack */}
            <div className="cta-stack flex-shrink-0">
              
                <button className="cta-btn-glass text-nowrap" onClick={() => navigate("/efootball")} title="eFootball">
                  <i className="bi bi-trophy-fill"></i>
                  <span className="cta-label">efootball</span>
                </button>
              

              {/* route to /jackpot */}
              <button className="cta-btn-glass text-nowrap" onClick={() => navigate("/jackpot")} title="Jackpot">
                <i className="bi bi-coin"></i>
                <span className="cta-label">Jackpot</span>
              </button>

              

              <button className="cta-btn-glass cta-btn-deposit text-nowrap" onClick={handleDeposit} title="My Wallet">
                <i className="bi bi-wallet2"></i>
                <span className="cta-label">Wallet</span>
              </button>

              <button className="cta-btn-glass text-nowrap" onClick={handleMybets} title="My Bets">
                <i className="bi bi-ticket-detailed-fill"></i>
                <span className="cta-label">Bets</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        /* Ensure body content doesn't get hidden under fixed header */

        .header-wrapper {
          z-index: 1030;
          background: rgba(3, 10, 26, 0.88);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .header-scrolled {
          background: rgba(2, 6, 18, 0.96);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }

        .navbar-container {
          position: relative;
          background: radial-gradient(circle at 20% 0%, rgba(13, 110, 253, 0.12) 0%, transparent 50%);
        }

        .navbar-brand-premium {
          position: relative;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .brand-text {
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-transform: lowercase;
          background: linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Horizontal compact button row */
        .cta-stack {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
        }

        .cta-btn-glass {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #ffffff;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }

        .cta-btn-glass i {
          font-size: 0.85rem;
          color: #fbbf24;
        }

        .cta-btn-deposit {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.06));
          border-color: rgba(34, 197, 94, 0.35);
        }

        .cta-btn-deposit i {
          color: #4ade80;
        }

        .cta-btn-glass:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(56, 189, 248, 0.4);
        }

        /* Responsive tweaks for very small screens */
        @media (max-width: 420px) {
          .brand-text { font-size: 1.2rem; }
          .cta-btn-glass { padding: 0.3rem 0.45rem; font-size: 0.7rem; gap: 4px; }
          .cta-stack { gap: 4px; }
        }

        @media (max-width: 360px) {
          /* On ultra-small screens, hide button text labels and show only icons to save space */
          .cta-label { display: none; }
          .cta-btn-glass { padding: 0.35rem 0.45rem; }
          .cta-btn-glass i { font-size: 1rem; margin: 0; }
        }
      `}</style>
    </header>
  );
}