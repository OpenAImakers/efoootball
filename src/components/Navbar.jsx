import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Detects current route for active highlighting

  return (
    <nav className="navbar fixed-top bg-black border-bottom border-primary shadow-lg" style={{ borderBottomWidth: '3px' }}>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center w-100">
          {/* Brand - gradient text matching theme */}
          <Link 
            className="navbar-brand fw-bold fs-4 me-4 me-md-5 text-decoration-none" 
            to="/dashboard"
            style={{
              background: 'linear-gradient(90deg, #0d6efd, #20c997, #fd7e14)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            efootball
          </Link>

          {/* Scrollable navigation links */}
          <div 
            className="d-flex flex-nowrap align-items-center overflow-auto flex-grow-1"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Hide scrollbar in WebKit browsers */}
            <style>{`
              .overflow-auto::-webkit-scrollbar { display: none; }
            `}</style>

            <NavLink to="/dashboard" icon="bi-house-door-fill" label="Home" currentPath={location.pathname} />
            <NavLink to="/teams" icon="bi-people-fill" label="Teams" currentPath={location.pathname} />
            <NavLink to="/admin" icon="bi-shield-lock-fill" label="Admin" currentPath={location.pathname} />
            <NavLink to="/account" icon="bi-person-fill" label="Account" currentPath={location.pathname} />

            {/* Logout button */}
            <button
              className="btn btn-sm btn-outline-primary rounded-pill fw-bold ms-3 px-3 py-1 d-flex align-items-center"
              onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
              style={{
                borderColor: '#fd7e14',
                color: '#fd7e14',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, currentPath }) {
  // Highlight if exact match or if it's a sub-route (e.g. /teams/something highlights "Teams")
  const isActive = currentPath === to || (to !== "/dashboard" && currentPath.startsWith(to + "/")) || (to !== "/dashboard" && currentPath === to);

  return (
    <Link
      to={to}
      className={`nav-link d-flex align-items-center px-3 py-2 mx-1 rounded-pill text-nowrap transition-all ${
        isActive 
          ? 'bg-gradient-active text-white shadow-sm' 
          : 'text-white-50'
      }`}
      style={{
        fontWeight: isActive ? '600' : '500',
        minWidth: 'fit-content',
      }}
    >
      <i 
        className={`bi ${icon} me-2 fs-5 ${isActive ? 'text-warning' : 'text-primary'}`}
        style={{ color: isActive ? '#fd7e14' : '#0d6efd' }}
      ></i>
      {label}
    </Link>
  );
}

// Add these styles to your component (or global CSS)
const navStyles = `
  .bg-gradient-active {
    background: linear-gradient(135deg, rgba(13, 110, 253, 0.35), rgba(32, 201, 151, 0.25), rgba(253, 126, 20, 0.25)) !important;
    border: 1px solid rgba(13, 110, 253, 0.6);
    box-shadow: 0 0 12px rgba(13, 110, 253, 0.45);
  }
  .nav-link {
    transition: all 0.25s ease;
  }
  .nav-link:hover:not(.bg-gradient-active) {
    background: rgba(13, 110, 253, 0.15);
    color: #0d6efd !important;
  }
`;

// In your component return, add:
<style>{navStyles}</style>