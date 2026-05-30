"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../supabase";

// --- INTERFACES ---
interface Clan {
  id: number;
  clan_name: string;
  clan_avatar: string | null;
  created_by: string;
  created_at: string;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  is_verified: boolean;
}

interface ClanPlayer {
  id: number;
  name: string;
  player_avatar: string | null;
  age: number | null;
  place: string | null;
  clan_id: number;
  user_id: string | null;
  gender: string;
  w: number;
  d: number;
  l: number;
  created_at: string;
}

type AdminTab = "verification" | "clan_stats" | "player_stats";

export default function ClanAdminForm() {
  // Navigation & View Layouts
  const [activeTab, setActiveTab] = useState<AdminTab>("verification");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClanFilter, setSelectedClanFilter] = useState<string>("all");
  const [message, setMessage] = useState<{ type: "success" | "danger" | "warning"; text: string } | null>(null);

  // Core Data Stores
  const [clans, setClans] = useState<Clan[]>([]);
  const [players, setPlayers] = useState<ClanPlayer[]>([]);
  const [filteredClans, setFilteredClans] = useState<Clan[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<ClanPlayer[]>([]);

  // Selected Target Reference States
  const [selectedClanId, setSelectedClanId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  // --- FORM DATA STATES (STRICTLY NUMERICAL PERFORMANCE STATS) ---
  const [clanFormData, setClanFormData] = useState({
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
  });

  const [playerFormData, setPlayerFormData] = useState({
    w: 0,
    d: 0,
    l: 0,
  });

  // --- NOTIFICATION HELPER ---
  const notify = (type: "success" | "danger" | "warning", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- SYSTEM FETCH CALLS ---
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: clansData, error: clansErr } = await supabase
        .from("clans")
        .select("*")
        .order("clan_name", { ascending: true });
      if (clansErr) throw clansErr;

      const { data: playersData, error: playersErr } = await supabase
        .from("clan_players")
        .select("*")
        .order("name", { ascending: true });
      if (playersErr) throw playersErr;

      setClans(clansData || []);
      setPlayers(playersData || []);
    } catch (err: any) {
      console.error(err);
      notify("danger", "Failed to retrieve administrative datasets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // --- CLIENT FILTER MANAGEMENT ---
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      setFilteredClans(clans);
    } else {
      setFilteredClans(clans.filter((c) => c.clan_name.toLowerCase().includes(term)));
    }

    let processedPlayers = [...players];
    
    if (selectedClanFilter !== "all") {
      const clanIdNum = parseInt(selectedClanFilter, 10);
      processedPlayers = processedPlayers.filter((p) => p.clan_id === clanIdNum);
    }
    
    if (term) {
      processedPlayers = processedPlayers.filter((p) => p.name.toLowerCase().includes(term));
    }
    
    setFilteredPlayers(processedPlayers);
  }, [searchTerm, selectedClanFilter, clans, players]);

  // --- CLEAN UP STATES ON TAB SWITCH ---
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSelectedClanFilter("all");
    setSelectedClanId(null);
    setSelectedPlayerId(null);
  };

  // --- TAB 1: TOGGLE CLAN VERIFICATION ---
  const toggleClanVerification = async (clanId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("clans")
        .update({ is_verified: !currentStatus })
        .eq("id", clanId);

      if (error) throw error;
      notify("success", `Verification status successfully modified.`);
      loadAdminData();
    } catch (err: any) {
      notify("danger", "Failed to change verification layer status.");
    }
  };

  // --- TAB 2: UPDATE CLAN RECORD MATCH STATISTICS ---
  const handleSelectClan = (clan: Clan) => {
    setSelectedClanId(clan.id);
    setClanFormData({
      w: clan.w,
      d: clan.d,
      l: clan.l,
      gf: clan.gf,
      ga: clan.ga,
    });
  };

  const handleClanNumberChange = (field: keyof typeof clanFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClanFormData((prev) => ({
      ...prev,
      [field]: val === "" ? 0 : Math.max(0, parseInt(val, 10)),
    }));
  };

  const handleClanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClanId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("clans")
        .update(clanFormData)
        .eq("id", selectedClanId);

      if (error) throw error;
      notify("success", "Clan match statistics updated successfully!");
      loadAdminData();
    } catch (err: any) {
      notify("danger", "Could not apply statistics amendments.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- TAB 3: UPDATE SQUAD PLAYER PERFORMANCE STATISTICS ---
  const handleSelectPlayer = (player: ClanPlayer) => {
    setSelectedPlayerId(player.id);
    setPlayerFormData({
      w: player.w,
      d: player.d,
      l: player.l,
    });
  };

  const handlePlayerNumberChange = (field: "w" | "d" | "l") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlayerFormData((prev) => ({
      ...prev,
      [field]: val === "" ? 0 : Math.max(0, parseInt(val, 10)),
    }));
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("clan_players")
        .update(playerFormData)
        .eq("id", selectedPlayerId);

      if (error) throw error;
      notify("success", "Player structural match statistics updated successfully.");
      loadAdminData();
    } catch (err: any) {
      notify("danger", "Failed to preserve updated performance parameters.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentGoalDifference = clanFormData.gf - clanFormData.ga;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <Navbar />

      {/* Dynamic Navigation Sub-Header Operations Bar */}
      <div className="bg-dark text-white py-3 px-4 shadow-sm" style={{ marginTop: "70px" }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock text-warning fs-4"></i>
            <h5 className="mb-0 fw-bold">Clan Admin</h5>
          </div>
          <div className="d-flex gap-2">
            {(["verification", "clan_stats", "player_stats"] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`btn btn-sm px-3 py-2 fw-semibold border-0 ${activeTab === tab ? "btn-success text-white" : "text-white-50"}`}
                style={{ borderRadius: "8px" }}
              >
                {tab === "verification" && <><i className="bi bi-patch-check me-2"></i>Verifications</>}
                {tab === "clan_stats" && <><i className="bi bi-trophy me-2"></i>Clan Statistics</>}
                {tab === "player_stats" && <><i className="bi bi-person-lines-fill me-2"></i>Player Statistics</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-fluid py-4 flex-grow-1">
        {/* Global Feedback Banner Message Portal */}
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
            <i className={`bi ${message.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
            <strong>{message.text}</strong>
            <button type="button" className="btn-close" onClick={() => setMessage(null)} />
          </div>
        )}

        {/* =========================================================================
            TAB 1: CLAN VERIFICATION SYSTEM VIEW
            ========================================================================= */}
        {activeTab === "verification" && (
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
              <div>
                <h4 className="fw-bold mb-1 text-dark">Clan Trust & Verifications</h4>
                <p className="text-muted small mb-0">Review newly formed clans and handle security verification flags.</p>
              </div>
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: "350px", borderRadius: "8px" }}
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
              <div className="row g-4">
                {filteredClans.map((clan) => (
                  <div key={clan.id} className="col-md-6 col-xl-4">
                    <div className="card border rounded-3 shadow-sm h-100 p-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "56px", height: "56px", overflow: "hidden" }}>
                          {clan.clan_avatar ? (
                            <img src={clan.clan_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <i className="bi bi-shield text-white-50 fs-4"></i>
                          )}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="text-truncate fw-bold mb-1 text-dark">{clan.clan_name}</h6>
                          <span className={`badge ${clan.is_verified ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                            {clan.is_verified ? "Verified Official" : "Unverified Status"}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleClanVerification(clan.id, clan.is_verified)}
                          className={`btn btn-sm px-3 fw-bold ${clan.is_verified ? "btn-outline-danger" : "btn-success"}`}
                          style={{ borderRadius: "6px" }}
                        >
                          {clan.is_verified ? "Revoke" : "Verify"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2 & 3: SPLIT-PANE OPERATIONS CONTROLLERS
            ========================================================================= */}
        {activeTab !== "verification" && (
          <div className="row g-4 h-100">
            {/* LEFT COMPONENT COLUMN VIEW SELECTOR */}
            <div className="col-lg-5 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 d-flex flex-column" style={{ maxHeight: "calc(100vh - 200px)" }}>
                <div className="p-3 border-bottom bg-white rounded-top-4">
                  <h5 className="fw-bold text-dark mb-3">
                    {activeTab === "clan_stats" ? "Select Clan" : "Select Player"}
                  </h5>
                  
                  {activeTab === "player_stats" && (
                    <div className="mb-2">
                      <label className="form-label small fw-bold text-muted text-uppercase mb-1">Filter by Clan</label>
                      <select
                        className="form-select form-select-sm mb-2"
                        style={{ borderRadius: "6px" }}
                        value={selectedClanFilter}
                        onChange={(e) => setSelectedClanFilter(e.target.value)}
                      >
                        <option value="all">All Clans</option>
                        {clans.map((c) => (
                          <option key={c.id} value={c.id}>{c.clan_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: "8px" }}
                    placeholder={activeTab === "clan_stats" ? "Search clan arrays..." : "Search matching names..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="overflow-auto bg-white rounded-bottom-4 flex-grow-1" style={{ overflowY: "auto" }}>
                  {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-success" /></div>
                  ) : activeTab === "clan_stats" ? (
                    filteredClans.length === 0 ? (
                      <div className="text-center py-4 text-muted small">No clans cataloged.</div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {filteredClans.map((clan) => (
                          <button
                            key={clan.id}
                            onClick={() => handleSelectClan(clan)}
                            className={`list-group-item list-group-item-action py-3 border-0 px-4 text-start ${selectedClanId === clan.id ? "bg-success-subtle text-success fw-bold" : ""}`}
                          >
                            <i className="bi bi-shield-shaded me-2"></i> {clan.clan_name}
                          </button>
                        ))}
                      </div>
                    )
                  ) : filteredPlayers.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No matching players found.</div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {filteredPlayers.map((player) => {
                        const associatedClan = clans.find((c) => c.id === player.clan_id);
                        return (
                          <button
                            key={player.id}
                            onClick={() => handleSelectPlayer(player)}
                            className={`list-group-item list-group-item-action py-3 border-0 px-4 d-flex flex-column align-items-start ${selectedPlayerId === player.id ? "bg-success-subtle text-success fw-bold" : ""}`}
                          >
                            <span className="text-truncate fw-semibold w-100">
                              <i className="bi bi-person-fill me-2 text-secondary"></i> {player.name}
                            </span>
                            <small className="text-muted ps-4" style={{ fontSize: "0.75rem" }}>
                              Clan: {associatedClan ? associatedClan.clan_name : "Unknown"}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COMPONENT INTERACTIVE UPDATE FORM VIEW */}
            <div className="col-lg-7 col-xl-8">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                {activeTab === "clan_stats" && (
                  <>
                    <div className="card-header bg-white py-4 border-0 rounded-top-4">
                      <h4 className="fw-bold mb-0 text-dark">
                        {selectedClanId ? `Modify Clan Stats: ${clans.find(c => c.id === selectedClanId)?.clan_name}` : "Select a Clan to Alter Records"}
                      </h4>
                    </div>
                    <div className="card-body p-4 p-lg-5 overflow-auto bg-white rounded-bottom-4">
                      {selectedClanId ? (
                        <form onSubmit={handleClanSubmit}>
                          <div className="row g-4">
                            {[
                              { label: "Wins (W)", key: "w", color: "success" },
                              { label: "Draws (D)", key: "d", color: "warning" },
                              { label: "Losses (L)", key: "l", color: "danger" },
                              { label: "Goals For (GF)", key: "gf", color: "dark" },
                              { label: "Goals Against (GA)", key: "ga", color: "dark" },
                            ].map(({ label, key, color }) => (
                              <div className="col-6 col-sm-4" key={key}>
                                <div className="p-3 bg-light rounded border text-center">
                                  <label className={`d-block small fw-bold text-${color} mb-1`}>{label}</label>
                                  <input
                                    type="number"
                                    className="form-control text-center fw-bold fs-4 border-0 bg-transparent"
                                    value={clanFormData[key as keyof typeof clanFormData]}
                                    onChange={handleClanNumberChange(key as keyof typeof clanFormData)}
                                    disabled={submitting}
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="col-6 col-sm-4">
                              <div className={`p-3 rounded border text-center ${currentGoalDifference >= 0 ? "bg-success-subtle border-success text-success" : "bg-danger-subtle border-danger text-danger"}`}>
                                <label className="d-block small fw-bold mb-1">Goal Diff (GD)</label>
                                <div className="fw-bold fs-3">{currentGoalDifference >= 0 ? "+" : ""}{currentGoalDifference}</div>
                              </div>
                            </div>
                            <div className="col-12 mt-5">
                              <button type="submit" disabled={submitting} className="btn btn-success btn-lg px-5 fw-bold shadow-sm">
                                {submitting ? "Updating Stats..." : "Save Clan Changes"}
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center py-5 text-muted">Select a clan from the listing pane to patch database configurations.</div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === "player_stats" && (
                  <>
                    <div className="card-header bg-white py-4 border-0 rounded-top-4">
                      <h4 className="fw-bold mb-0 text-dark">
                        {selectedPlayerId ? `Update Statistics: ${players.find(p => p.id === selectedPlayerId)?.name}` : "Select a Player to Update Performance Metrics"}
                      </h4>
                    </div>
                    <div className="card-body p-4 p-lg-5 overflow-auto bg-white rounded-bottom-4">
                      {selectedPlayerId ? (
                        <form onSubmit={handlePlayerSubmit}>
                          <div className="row g-4">
                            <div className="col-12">
                              <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-2 mb-4">
                                <i className="bi bi-info-circle-fill fs-5"></i>
                                <span className="small">You are updating competitive records ($W/D/L$). Player profiles can only be managed by users.</span>
                              </div>
                            </div>

                            {[
                              { label: "Wins (W)", key: "w", color: "success" },
                              { label: "Draws (D)", key: "d", color: "warning" },
                              { label: "Losses (L)", key: "l", color: "danger" },
                            ].map(({ label, key, color }) => (
                              <div className="col-md-4" key={key}>
                                <div className="p-4 bg-light rounded border text-center shadow-sm">
                                  <label className={`d-block small fw-bold text-uppercase text-${color} mb-2`}>{label}</label>
                                  <input
                                    type="number"
                                    className="form-control text-center fw-bold fs-3 border-0 bg-transparent"
                                    value={playerFormData[key as "w" | "d" | "l"]}
                                    onChange={handlePlayerNumberChange(key as "w" | "d" | "l")}
                                    disabled={submitting}
                                  />
                                </div>
                              </div>
                            ))}

                            <div className="col-12 mt-5 border-top pt-4">
                              <button type="submit" disabled={submitting} className="btn btn-success btn-lg px-5 fw-bold shadow-sm">
                                {submitting ? "Updating Stats..." : "Save Player Stats"}
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center py-5 text-muted">Select an individual player from the left panel to update performance stats.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}