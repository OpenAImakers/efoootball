import React from "react";
import { Link } from "react-router-dom";
import LeaguesNavbar from "./Leaguenav";

export default function LeagueOperations() {

  return (
    <div className="min-vh-100 w-100 bg-white">

      <LeaguesNavbar />

      {/* Page Header */}
      <div className="w-100 border-bottom px-4 py-3">
        <h4 className="fw-bold m-0">League Operations</h4>
      </div>

      {/* Operations */}
      <div className="w-100 px-4 py-3">

        <div className="list-group w-100">

          {/* Add League */}
          <Link
            to="/dashboard"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center w-100"
          >
            <span className="d-flex align-items-center">
              <i className="bi bi-plus-circle me-3 text-primary fs-5"></i>
              Add New League
            </span>

            <i className="bi bi-chevron-right text-muted"></i>
          </Link>

          {/* Manage Leagues */}
          <Link
            to="/dashboard"
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center w-100"
          >
            <span className="d-flex align-items-center">
              <i className="bi bi-gear me-3 text-primary fs-5"></i>
              Manage Leagues
            </span>

            <i className="bi bi-chevron-right text-muted"></i>
          </Link>

        </div>

      </div>

      <style>{`

        .list-group-item{
          padding:18px 20px;
          font-weight:500;
          border-left:none;
          border-right:none;
        }

        .list-group-item:first-child{
          border-top:1px solid #dee2e6;
        }

        .list-group-item:hover{
          background:#f8fbff;
        }

      `}</style>

    </div>
  );
}