"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

interface Clan {
  id: string;
  clan_name: string;
  clan_avatar: string;
  created_by: string;
  created_at: string;
  is_verified: boolean; // Added type safe mapping properties
}

interface ClanPlayer {
  id: string;
  name: string;
  player_avatar: string;
  age: number;
  place: string;
  clan_id: string;
}

interface ClansTabProps {
  clansSearchTerm: string;
  setClansSearchTerm: (val: string) => void;
  filteredClans: Clan[];
  playersMap: Record<string, ClanPlayer[]>;
}

export default function ClansTab({
  clansSearchTerm,
  setClansSearchTerm,
  filteredClans,
  playersMap,
}: ClansTabProps) {
  const navigate = useNavigate();

  return (
    <div>
      {/* Global Safety Advisory Alert Notice */}
      <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-3 mb-4 p-3" style={{ borderRadius: "12px" }}>
        <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
        <div>
          <strong className="d-block text-dark">Safety Advisory Notice</strong>
          <span className="text-muted small">Players are strongly advised <strong>not</strong> to register with unverified clans. Look for the verification badge to ensure competitive safety.</span>
        </div>
      </div>

      {/* Search and Action Input Grid Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-lg border-start-0"
              placeholder="Search Clans..."
              value={clansSearchTerm}
              onChange={(e) => setClansSearchTerm(e.target.value)}
              style={{
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                backgroundColor: "white",
              }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate("/registerclans")}
          className="btn btn-primary btn-lg shadow-sm px-4 py-2"
          style={{
            background: "linear-gradient(135deg, #fdf91b 0%, #13ff0f 100%)",
            border: "none",
            fontWeight: "600",
            borderRadius: "8px",
            color: "#000",
          }}
        >
          <i className="bi bi-shield-plus me-2"></i>Create New Clan
        </button>
      </div>

      {/* Grid Content Cards */}
      {filteredClans.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted">
            {clansSearchTerm ? "No clans match your search" : "No clans available"}
          </h5>
          {!clansSearchTerm && (
            <button
              onClick={() => navigate("/registerclans")}
              className="btn btn-outline-primary mt-3 rounded-pill"
            >
              Create the first clan
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {filteredClans.map((clan) => {
            const players = playersMap[clan.id] || [];

            return (
              <div key={clan.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow rounded-4 overflow-hidden h-100">
                  {/* Clan Avatar Banner Image Block */}
                  <div className="position-relative" style={{ height: "200px", backgroundColor: "#1a1a2e" }}>
                    {clan.clan_avatar ? (
                      <img
                        src={clan.clan_avatar}
                        alt={clan.clan_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white-50">
                        <i className="bi bi-shield-shaded" style={{ fontSize: "65px" }}></i>
                      </div>
                    )}

                    {/* Verification / Security Status Tag badges */}
                    <div className="position-absolute top-0 end-0 m-3">
                      {clan.is_verified ? (
                        <span className="badge bg-success border border-white border-2 px-3 py-2 shadow-sm d-flex align-items-center gap-1" style={{ borderRadius: "20px" }}>
                          <i className="bi bi-patch-check-fill fs-6"></i> Verified Clan
                        </span>
                      ) : (
                        <span className="badge bg-secondary border border-white border-2 px-3 py-2 shadow-sm d-flex align-items-center gap-1" style={{ borderRadius: "20px", opacity: 0.9 }}>
                          <i className="bi bi-shield-exclamation fs-6"></i> Unverified
                        </span>
                      )}
                    </div>

                    <div
                      className="position-absolute bottom-0 start-0 end-0"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                        padding: "20px 15px 10px 15px",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <h4 className="text-white mb-0 fw-bold">{clan.clan_name}</h4>
                        {clan.is_verified && <i className="bi bi-patch-check-fill text-info fs-5" title="Verified Clan"></i>}
                      </div>
                      <small className="text-white-50">
                        Created: {new Date(clan.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>

                  {/* Body Content Block */}
                  <div className="p-4 d-flex flex-column justify-content-between" style={{ flexGrow: 1 }}>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted">Players Registered</span>
                        <span className="badge bg-primary fs-6">
                          {players.length} {players.length === 1 ? "Player" : "Players"}
                        </span>
                      </div>

                      {/* Squad Avatars Listing Tracking Row */}
                      {players.length > 0 && (
                        <div className="d-flex flex-wrap gap-2">
                          {players.slice(0, 3).map((player) => (
                            <div
                              key={player.id}
                              className="d-flex align-items-center gap-2 bg-light rounded-3 px-2 py-1"
                            >
                              {player.player_avatar ? (
                                <img
                                  src={player.player_avatar}
                                  alt={player.name}
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <i className="bi bi-person-circle text-secondary" style={{ fontSize: "16px" }}></i>
                              )}
                              <span className="small fw-semibold">{player.name}</span>
                            </div>
                          ))}
                          {players.length > 3 && (
                            <span className="text-muted small align-self-center ps-1">
                              +{players.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/registerclans/${clan.id}`)}
                      className="btn w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, #fdf91b 0%, #13ff0f 100%)",
                        border: "none",
                        fontWeight: "700",
                        borderRadius: "8px",
                        color: "#000",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <i className="bi bi-box-arrow-in-right"></i> Register for {clan.clan_name}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}