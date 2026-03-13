import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function LeaguesNavbar() {
  const location = useLocation();


  return (
<nav className="sticky-top bg-dark border-bottom border-primary shadow-lg" style={{ zIndex: 1050 }}>

  <div className="container-fluid px-4">

    <div className="d-flex align-items-center" style={{ height: "65px" }}>

      <Link
        to="/leagues"
        className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase ${
          location.pathname === "/leagues"
            ? "text-primary border-bottom border-primary"
            : "text-white-50 hover-white"
        }`}
      >
        <i className="bi bi-trophy-fill me-2"></i>
        Leagues
      </Link>

      <Link
        to="/dashboard"
        className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase ${
          location.pathname === "/dashboard"
            ? "text-primary border-bottom border-primary"
            : "text-white-50 hover-white"
        }`}
      >
        <i className="bi bi-house me-2"></i>
        Home
      </Link>

      <Link
        to="/leaguelandingpage"
        className={`text-decoration-none px-3 h-100 d-flex align-items-center fw-bold text-uppercase ${
          location.pathname === "/leaguelandingpage"
            ? "text-primary border-bottom border-primary"
            : "text-white-50 hover-white"
        }`}
      >
        <i className="bi bi-gear me-2"></i>
        Manage
      </Link>

    </div>

  </div>

</nav>
  );
}