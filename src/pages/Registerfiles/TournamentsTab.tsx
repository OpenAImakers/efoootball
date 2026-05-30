"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

interface TournamentsTabProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filteredRegistrations: any[];
  teamsMap: Record<number, any[]>;
  profilesMap: Record<string, any>;
}

export default function TournamentsTab({
  searchTerm,
  setSearchTerm,
  filteredRegistrations,
  teamsMap,
  profilesMap,
}: TournamentsTabProps) {
  const navigate = useNavigate();

  return (
    <div>
      {/* Search and Action Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-lg border-start-0"
              placeholder="Search Tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                backgroundColor: "white",
              }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate("/registrations")}
          className="btn btn-primary btn-lg shadow-sm px-4 py-2"
          style={{
            background: "linear-gradient(135deg, #35962e 0%, #863131 100%)",
            border: "none",
            fontWeight: "600",
            borderRadius: "8px",
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>Have a squad? Create a registration here
        </button>
      </div>

      {/* Main Grid Row Layout */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted">
            {searchTerm ? "No tournaments match your search" : "No active tournaments"}
          </h5>
          {!searchTerm && (
            <button
              onClick={() => navigate("/registrations")}
              className="btn btn-outline-primary mt-3 rounded-pill"
            >
              Create the first tournament
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {filteredRegistrations.map((reg) => {
            const teams = teamsMap[reg.id] || [];
            const isFull = teams.length >= reg.max_players;
            const totalBudget = reg.max_players * reg.registration_amount;
            
            const hostProfile = reg.created_by ? profilesMap[reg.created_by] : null;
            const hostName =
              hostProfile?.display_name ||
              hostProfile?.username ||
              reg.created_by?.slice(0, 8) ||
              "Anonymous";

            return (
              <div key={reg.id} className="col-12">
                <div className="card border-0 shadow rounded-4 overflow-hidden">
                  {/* Banner Stripe Layout */}
                  <div
                    className="position-relative"
                    style={{
                      background: `linear-gradient(
                        to bottom,
                        #000 0%, #000 20%,
                        #fff 20%, #fff 25%,
                        #d21034 25%, #d21034 50%,
                        #fff 50%, #fff 55%,
                        #007847 55%, #007847 80%,
                        #000 80%
                      )`,
                      padding: "50px 0",
                    }}
                  >
                    <div className="text-center">
                      <div className="moving-image-wrapper" style={{ display: "inline-block" }}>
                        <img
                          src={reg.avatar_url || "/kicc.jpeg"}
                          alt={reg.name}
                          className="img-fluid rounded-4 shadow-lg moving-image"
                          style={{
                            maxHeight: "240px",
                            width: "auto",
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="position-absolute bottom-0 start-0 end-0"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                        padding: "30px 20px 15px 20px",
                      }}
                    >
                      <h3 className="text-white mb-0 fw-bold text-center">{reg.name}</h3>
                    </div>
                  </div>

                  {/* Operational Metrics Block */}
                  <div className="p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
                      <div className="d-flex gap-4 flex-wrap">
                        <div>
                          <small className="text-muted d-block">Total Budget</small>
                          <strong className="fs-5 text-primary">
                            KES {totalBudget.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <small className="text-muted d-block">Entry Fee</small>
                          <strong className="fs-5 text-primary">KES {reg.registration_amount}</strong>
                        </div>
                        <div>
                          <small className="text-muted d-block">Max Teams</small>
                          <strong className="fs-5">{reg.max_players}</strong>
                        </div>
                        <div>
                          <small className="text-muted d-block">Created</small>
                          <strong className="fs-5">{new Date(reg.created_at).toLocaleDateString()}</strong>
                        </div>
                        <div>
                          <small className="text-muted d-block">Host/Sponsor</small>
                          <strong className="fs-5 text-primary">{hostName}</strong>
                        </div>
                      </div>
                      <div className="mt-2 mt-sm-0">
                        {isFull ? (
                          <span className="badge bg-danger px-3 py-2 fs-6">FULL</span>
                        ) : (
                          <span className="badge bg-primary px-3 py-2 fs-6">
                            {teams.length} / {reg.max_players} Teams
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Sheet Actions */}
                    <div 
                      className="d-flex align-items-center justify-content-between bg-white p-3 rounded-4 shadow-sm border mb-3" 
                      style={{ cursor: "pointer", transition: "0.2s" }}
                      onClick={async () => {
                        const shareUrl = `https://efootballkenyaleague.website/registration/${reg.id}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: reg.name || "eFootball Tournament",
                              text: `Entry Fee: KES ${reg.registration_amount}. Join the ${reg.name} squad!`,
                              url: shareUrl,
                            });
                          } catch (err) {
                            console.log("Share cancelled");
                          }
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                          alert("Link copied! Paste it in WhatsApp or Telegram.");
                        }
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                    >
                      <div>
                        <h6 className="mb-0 fw-bold">Invite Players</h6>
                        <small className="text-muted">Share this tournament link</small>
                      </div>
                      <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                        <i className="bi bi-share-fill text-primary"></i>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end align-items-center mt-3">
                      <button 
                        onClick={() => navigate(`/registration/${reg.id}`)}
                        className="btn btn-outline-primary fw-bold d-flex align-items-center gap-2 px-4 py-2"
                        style={{ borderRadius: "8px" }}
                      >
                        Register <i className="bi bi-pencil-square fs-5"></i>
                      </button>
                    </div>
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