import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for language toggle: false = English (Default), true = French
  const [isFrench, setIsFrench] = useState(false);

  const toggleLanguage = () => setIsFrench(!isFrench);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile role:", error);
          setIsAdmin(false);
        } else if (profile) {
          setIsAdmin(profile.role === "admin");
        }
      } catch (err) {
        console.error("Auth/role check failed:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkUserRole();
      else setIsAdmin(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // LOADING STATE WITH MOVING FOOTBALL
  if (loading) {
    return (
      <nav className="navbar fixed-top bg-black border-bottom border-primary shadow-lg" style={{ borderBottomWidth: '2px' }}>
        <div className="container-fluid px-3 px-md-4 px-lg-5">
          <div className="d-flex align-items-center w-100" style={{ height: '60px', overflow: 'hidden' }}>
            <Link
              className="navbar-brand fw-black text-decoration-none me-4 me-lg-5 flex-shrink-0"
              to="/leagues"
              style={{
                fontSize: '1.9rem',
                letterSpacing: '-1px',
                background: 'linear-gradient(90deg, #0d6efd, #20c997, #fd7e14)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textTransform: 'lowercase',
                zIndex: 10
              }}
            >
              efootball
            </Link>

            <div className="flex-grow-1 position-relative d-flex align-items-center h-100">
              <img 
                src="/ball.png" 
                alt="..." 
                className="moving-ball"
                style={{ 
                  width: '4.5rem', 
                  height: '4.5rem', 
                  objectFit: 'contain', 
                  borderRadius: '50%',
                  position: 'absolute'
                }}
              />
            </div>
          </div>
        </div>
        <style>{`
          .moving-ball { animation: moveRightLeft 2.5s infinite ease-in-out; }
          @keyframes moveRightLeft {
            0% { left: 0%; transform: rotate(0deg); }
            50% { left: 85%; transform: rotate(720deg); }
            100% { left: 0%; transform: rotate(0deg); }
          }
          @media (max-width: 576px) {
            .moving-ball { width: 2.8rem !important; height: 2.8rem !important; }
            @keyframes moveRightLeft {
              0% { left: 0%; transform: rotate(0deg); }
              50% { left: 70%; transform: rotate(720deg); }
              100% { left: 0%; transform: rotate(0deg); }
            }
          }
        `}</style>
      </nav>
    );
  }

  return (
    <nav className="navbar fixed-top bg-black border-bottom border-primary shadow-lg" style={{ borderBottomWidth: '2px' }}>
      <div className="container-fluid px-3 px-md-4 px-lg-5">
        <div className="d-flex align-items-center w-100">
          
          {/* Brand - Redirects to Leagues */}
          <Link
            className="navbar-brand fw-black text-decoration-none me-3 me-lg-4 flex-shrink-0 brand-logo"
            to="/leagues"
            style={{
              fontSize: '1.9rem',
              letterSpacing: '-1px',
              background: 'linear-gradient(90deg, #0d6efd, #20c997, #fd7e14)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'lowercase',
              transition: 'opacity 0.2s ease'
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
              .brand-logo:hover { opacity: 0.8; cursor: pointer; }
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
            <NavLink 
  to="/teams" 
  label={isFrench ? "Calendrier" : "FIXTURES"} 
  currentPath={location.pathname} 
/>
            {isAdmin && <NavLink to="/admin" label="Admin" currentPath={location.pathname} />}
            <NavLink to="/leaderboard" label={isFrench ? "Classement" : "Leaderboard"} currentPath={location.pathname} />
            <NavLink to="/register" label={isFrench ? "S'inscrire" : "Register"} currentPath={location.pathname} />
            <NavLink to="/account" label={isFrench ? "Compte" : "Account"} currentPath={location.pathname} />
          </div>

          {/* Language Toggle */}
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
  const isActive = currentPath === to || (to !== "/dashboard" && currentPath.startsWith(to + "/"));
  return (
    <Link
      to={to}
      className={`nav-link text-nowrap ${isActive ? 'active' : 'text-white-50'}`}
      style={{ minWidth: 'fit-content' }}
    >
      {label}
    </Link>
  );
}
