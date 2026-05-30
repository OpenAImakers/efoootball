"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../supabase";
import VerificationTab from "./VerificationTab";
import ClanStatsTab from "./ClanStatsTab";
import PlayerStatsTab from "./PlayerStatsTab";

// --- INTERFACES ---
export interface Clan {
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

export interface ClanPlayer {
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
  const [activeTab, setActiveTab] = useState<AdminTab>("verification");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "danger" | "warning"; text: string } | null>(null);

  const [clans, setClans] = useState<Clan[]>([]);
  const [players, setPlayers] = useState<ClanPlayer[]>([]);

  const notify = (type: "success" | "danger" | "warning", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

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

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <Navbar />

      <div className="bg-dark text-white py-3 px-4 shadow-sm" style={{ marginTop: "70px" }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
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
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
            <i className={`bi ${message.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
            <strong>{message.text}</strong>
            <button type="button" className="btn-close" onClick={() => setMessage(null)} />
          </div>
        )}

        {activeTab === "verification" && (
          <VerificationTab
            clans={clans}
            loading={loading}
            notify={notify}
            loadAdminData={loadAdminData}
          />
        )}

        {activeTab === "clan_stats" && (
          <ClanStatsTab
            clans={clans}
            loading={loading}
            notify={notify}
            loadAdminData={loadAdminData}
          />
        )}

        {activeTab === "player_stats" && (
          <PlayerStatsTab
            clans={clans}
            players={players}
            loading={loading}
            notify={notify}
            loadAdminData={loadAdminData}
          />
        )}
      </div>
    </div>
  );
}