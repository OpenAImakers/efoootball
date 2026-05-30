"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { Clan, ClanPlayer } from "./ClanAdminForm";

interface PlayerStatsTabProps {
  clans: Clan[];
  players: ClanPlayer[];
  loading: boolean;
  notify: (type: "success" | "danger" | "warning", text: string) => void;
  loadAdminData: () => void;
}

export default function PlayerStatsTab({ clans, players, loading, notify, loadAdminData }: PlayerStatsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClanFilter, setSelectedClanFilter] = useState<string>("all");
  const [filteredPlayers, setFilteredPlayers] = useState<ClanPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [playerFormData, setPlayerFormData] = useState({
    w: 0,
    d: 0,
    l: 0,
  });

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    let processedPlayers = [...players];

    if (selectedClanFilter !== "all") {
      const clanIdNum = parseInt(selectedClanFilter, 10);
      processedPlayers = processedPlayers.filter((p) => p.clan_id === clanIdNum);
    }

    if (term) {
      processedPlayers = processedPlayers.filter((p) => p.name.toLowerCase().includes(term));
    }

    setFilteredPlayers(processedPlayers);
  }, [searchTerm, selectedClanFilter, players]);

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

  return (
    <div className="row g-4 h-100">
      <div className="col-lg-5 col-xl-4">
        <div className="card border-0 shadow-sm rounded-4 d-flex flex-column" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <div className="p-3 border-bottom bg-white rounded-top-4">
            <h5 className="fw-bold text-dark mb-3">Select Player</h5>
            
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

            <input
              type="text"
              className="form-control"
              style={{ borderRadius: "8px" }}
              placeholder="Search matching names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-auto bg-white rounded-bottom-4 flex-grow-1" style={{ overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-success" /></div>
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

      <div className="col-lg-7 col-xl-8">
        <div className="card border-0 shadow-sm rounded-4 h-100">
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
                      <span className="small">You are updating competitive records (W/D/L). Player profiles can only be managed by users.</span>
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
        </div>
      </div>
    </div>
  );
}