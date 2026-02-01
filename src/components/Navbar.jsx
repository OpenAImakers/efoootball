import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar fixed-top bg-black border-bottom border-primary shadow-lg" style={{ borderBottomWidth: '4px' }}>
      <div className="container-fluid px-3 px-md-4 px-lg-5">
        <div className="d-flex align-items-center w-100">

          {/* Brand */}
          <Link
            className="navbar-brand fw-bold text-decoration-none me-4 me-lg-5 flex-shrink-0"
            to="/dashboard"
            style={{
              fontSize: '2.1rem',
              background: 'linear-gradient(90deg, #0d6efd, #20c997, #fd7e14)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            efootball
          </Link>

          {/* Scrollable area: links + logout */}
          <div
            className="d-flex align-items-center flex-nowrap overflow-auto flex-grow-1 ps-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Hide scrollbar visually */}
            <style>{`
              .overflow-auto::-webkit-scrollbar {
                display: none;
              }
              .overflow-auto {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }

              .nav-link {
                font-size: 1.35rem;
                padding: 0.75rem 1.5rem;
                transition: all 0.25s ease;
                border-radius: 9999px;
                white-space: nowrap;
              }

              .nav-link:hover:not(.active) {
                background: rgba(13, 110, 253, 0.18);
                color: #fff !important;
              }

              .active {
                background: linear-gradient(135deg, rgba(13,110,253,0.4), rgba(32,201,151,0.3), rgba(253,126,20,0.3)) !important;
                color: white !important;
                box-shadow: 0 0 14px rgba(13,110,253,0.5);
                font-weight: 700;
              }

              @media (max-width: 576px) {
                .navbar-brand { font-size: 1.8rem !important; }
                .nav-link { font-size: 1.15rem; padding: 0.6rem 1.1rem; }
                .logout-btn { font-size: 1.05rem !important; padding: 0.5rem 1.2rem !important; }
              }

              @media (max-width: 400px) {
                .nav-link { padding: 0.5rem 0.9rem; font-size: 1.05rem; }
              }
            `}</style>

            <NavLink to="/dashboard" icon="bi-house-door-fill" label="Home"   currentPath={location.pathname} />
            <NavLink to="/teams"     icon="bi-people-fill"      label="Teams"  currentPath={location.pathname} />
            <NavLink to="/admin"     icon="bi-shield-lock-fill"  label="Admin"  currentPath={location.pathname} />
            <NavLink to="/account"   icon="bi-person-fill"      label="Account" currentPath={location.pathname} />

            {/* Logout inside the scrollable area */}
            <button
              className="btn btn-outline-primary rounded-pill fw-bold d-flex align-items-center px-4 py-2 ms-3 logout-btn flex-shrink-0"
              onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
              style={{
                borderColor: '#fd7e14',
                color: '#fd7e14',
                fontSize: '1.25rem',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content',
              }}
            >
              <i className="bi bi-box-arrow-right me-2 fs-4"></i>
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, currentPath }) {
  const isActive =
    currentPath === to ||
    (to !== "/dashboard" && currentPath.startsWith(to + "/"));

  return (
    <Link
      to={to}
      className={`nav-link d-flex align-items-center text-nowrap me-2 ${isActive ? 'active' : 'text-white-50'}`}
      style={{
        fontWeight: isActive ? '700' : '600',
        minWidth: 'fit-content',
      }}
    >
      <i
        className={`bi ${icon} me-2 fs-4 ${isActive ? 'text-warning' : 'text-primary'}`}
        style={{ color: isActive ? '#fd7e14' : '#0d6efd' }}
      />
      {label}
    </Link>
  );
}