"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { Clan } from "./ClanAdminForm";

interface VerificationTabProps {
  clans: Clan[];
  loading: boolean;
  notify: (type: "success" | "danger" | "warning", text: string) => void;
  loadAdminData: () => void;
}

export default function VerificationTab({ clans, loading, notify, loadAdminData }: VerificationTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClans, setFilteredClans] = useState<Clan[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ clanId: number; clanName: string; action: "verify" | "revoke" } | null>(null);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredClans(clans);
    } else {
      setFilteredClans(clans.filter((c) => c.clan_name.toLowerCase().includes(term)));
    }
  }, [searchTerm, clans]);

  const toggleClanVerification = async (clanId: number, currentStatus: boolean) => {
    setConfirmAction({
      clanId,
      clanName: clans.find(c => c.id === clanId)?.clan_name || "",
      action: currentStatus ? "revoke" : "verify",
    });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      const { error } = await supabase
        .from("clans")
        .update({ is_verified: confirmAction.action === "verify" })
        .eq("id", confirmAction.clanId);

      if (error) throw error;
      notify("success", `Clan "${confirmAction.clanName}" ${confirmAction.action === "verify" ? "verified" : "unverified"} successfully.`);
      loadAdminData();
    } catch (err: any) {
      notify("danger", "Failed to change verification status.");
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark">Clan Trust & Verifications</h4>
          <p className="text-muted small mb-3">Review newly formed clans and handle security verification flags.</p>
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "400px", borderRadius: "8px" }}
            placeholder="Search registered clans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-success" /></div>
        ) : filteredClans.length === 0 ? (
          <div className="text-center py-5 text-muted">No clans match search parameters.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "60px" }}></th>
                  <th>Clan Name</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClans.map((clan) => (
                  <tr key={clan.id}>
                    <td>
                      <div 
                        className="rounded-circle bg-dark d-flex align-items-center justify-content-center" 
                        style={{ width: "44px", height: "44px", overflow: "hidden" }}
                      >
                        {clan.clan_avatar ? (
                          <img src={clan.clan_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <i className="bi bi-shield text-white-50"></i>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{clan.clan_name}</span>
                    </td>
                    <td>
                      <span className={`badge ${clan.is_verified ? "bg-success" : "bg-warning text-dark"}`}>
                        {clan.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => toggleClanVerification(clan.id, clan.is_verified)}
                        className={`btn btn-sm fw-bold ${clan.is_verified ? "btn-outline-danger" : "btn-success"}`}
                        style={{ minWidth: "80px", borderRadius: "6px" }}
                      >
                        {clan.is_verified ? "Revoke" : "Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">
                  {confirmAction.action === "verify" ? "Verify Clan" : "Revoke Verification"}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setConfirmAction(null)}
                />
              </div>
              <div className="modal-body px-4 py-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${confirmAction.action === "verify" ? "bg-success-subtle" : "bg-danger-subtle"}`} style={{ width: "48px", height: "48px" }}>
                    <i className={`bi ${confirmAction.action === "verify" ? "bi-check-circle text-success" : "bi-x-circle text-danger"} fs-4`}></i>
                  </div>
                  <div>
                    <p className="mb-1 fw-semibold">
                      {confirmAction.action === "verify" ? "Confirm Verification" : "Confirm Revocation"}
                    </p>
                    <p className="text-muted small mb-0">
                      Are you sure you want to {confirmAction.action === "verify" ? "verify" : "revoke verification for"} <strong>"{confirmAction.clanName}"</strong>?
                    </p>
                  </div>
                </div>
                {confirmAction.action === "revoke" && (
                  <div className="alert alert-warning border-0 rounded-3 small mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This clan will lose its verified status and may affect trust signals.
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button 
                  type="button" 
                  className="btn btn-light fw-bold px-4" 
                  onClick={() => setConfirmAction(null)}
                  style={{ borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn fw-bold px-4 ${confirmAction.action === "verify" ? "btn-success" : "btn-danger"}`}
                  onClick={handleConfirm}
                  style={{ borderRadius: "8px" }}
                >
                  {confirmAction.action === "verify" ? "Yes, Verify" : "Yes, Revoke"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}