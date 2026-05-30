"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import TournamentsTab from "./Registerfiles/TournamentsTab";
import ClansTab from "./Registerfiles/ClansTab";

const REGISTRATION_CACHE_KEY = "registrations_cache";
const CLANS_CACHE_KEY = "clans_cache";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minutes

interface Clan {
  id: string;
  clan_name: string;
  clan_avatar: string;
  created_by: string;
  created_at: string;
  is_verified: boolean;
}

interface ClanPlayer {
  id: string;
  name: string;
  player_avatar: string;
  age: number;
  place: string;
  clan_id: string;
}

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<"tournaments" | "clans">("tournaments");
  const [loading, setLoading] = useState(false);
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Record<number, any[]>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const [clans, setClans] = useState<Clan[]>([]);
  const [playersMap, setPlayersMap] = useState<Record<string, ClanPlayer[]>>({});
  const [clansSearchTerm, setClansSearchTerm] = useState("");
  
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cachedRegs = localStorage.getItem(REGISTRATION_CACHE_KEY);
    if (cachedRegs) {
      const { registrations: cRegs, teamsMap: cTeamsMap, profilesMap: cProfilesMap } = JSON.parse(cachedRegs);
      if (cRegs) setRegistrations(cRegs);
      if (cTeamsMap) setTeamsMap(cTeamsMap);
      if (cProfilesMap) setProfilesMap(cProfilesMap);
    }
    
    const cachedClans = localStorage.getItem(CLANS_CACHE_KEY);
    if (cachedClans) {
      const { clans: cClans, playersMap: cPlayersMap } = JSON.parse(cachedClans);
      if (cClans) setClans(cClans);
      if (cPlayersMap) setPlayersMap(cPlayersMap);
    }
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
    try {
      const { data: regs } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (regs) {
        setRegistrations(regs);

        const userIds = regs.map((reg) => reg.created_by).filter(Boolean);
        let profilesObj: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds);
          
          profiles?.forEach((profile) => {
            profilesObj[profile.id] = profile;
          });
          setProfilesMap(profilesObj);
        }

        const { data: teams } = await supabase
          .from("tournament_registrations")
          .select("*")
          .order("created_at", { ascending: false });

        const groupedTeams: Record<number, any[]> = {};
        teams?.forEach((team) => {
          if (!groupedTeams[team.registration_id]) groupedTeams[team.registration_id] = [];
          groupedTeams[team.registration_id].push(team);
        });
        setTeamsMap(groupedTeams);

        localStorage.setItem(
          REGISTRATION_CACHE_KEY,
          JSON.stringify({
            registrations: regs,
            teamsMap: groupedTeams,
            profilesMap: profilesObj,
            timestamp: Date.now(),
          })
        );
      }

      const { data: clansData } = await supabase
        .from("clans")
        .select("*")
        .order("created_at", { ascending: false });

      if (clansData) {
        setClans(clansData);

        const { data: playersData } = await supabase
          .from("clan_players")
          .select("*")
          .order("created_at", { ascending: false });

        const groupedPlayers: Record<string, ClanPlayer[]> = {};
        playersData?.forEach((player) => {
          if (!groupedPlayers[player.clan_id]) groupedPlayers[player.clan_id] = [];
          groupedPlayers[player.clan_id].push(player);
        });
        setPlayersMap(groupedPlayers);

        localStorage.setItem(
          CLANS_CACHE_KEY,
          JSON.stringify({
            clans: clansData,
            playersMap: groupedPlayers,
            timestamp: Date.now(),
          })
        );
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    refreshTimer.current = setInterval(() => {
      fetchData(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchData]);

  const filteredRegistrations = registrations.filter((reg) =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClans = clans.filter((clan) =>
    clan.clan_name.toLowerCase().includes(clansSearchTerm.toLowerCase())
  );

  return (
    <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
      <Navbar />

      <div 
        className="container-fluid px-4 py-3 shadow-sm"
        style={{
          position: "sticky",
          top: "68px",
          zIndex: 1020,
          backgroundColor: "#f0f2f5",
          borderBottom: "1px solid #dee2e6"
        }}
      >
        <div className="d-flex gap-3 border-bottom pb-2">
          <button
            onClick={() => setActiveTab("tournaments")}
            className="btn px-4 py-2 fw-bold d-flex align-items-center gap-2"
            style={{
              backgroundColor: activeTab === "tournaments" ? "#35962e" : "transparent",
              color: activeTab === "tournaments" ? "white" : "#6c757d",
              border: "none",
              borderRadius: "8px",
              transition: "all 0.2s"
            }}
          >
            <i className="bi bi-trophy-fill"></i> Tournaments
          </button>
          
          <button
            onClick={() => setActiveTab("clans")}
            className="btn px-4 py-2 fw-bold d-flex align-items-center gap-2"
            style={{
              backgroundColor: activeTab === "clans" ? "#13ff0f" : "transparent",
              color: activeTab === "clans" ? "#000" : "#6c757d",
              border: "none",
              borderRadius: "8px",
              transition: "all 0.2s"
            }}
          >
            <i className="bi bi-people-fill"></i> Clans
          </button>
        </div>
      </div>

      <div className="container-fluid px-4 py-4">
        {loading && (activeTab === "tournaments" ? registrations.length === 0 : clans.length === 0) ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : activeTab === "tournaments" ? (
          <TournamentsTab 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredRegistrations={filteredRegistrations}
            teamsMap={teamsMap}
            profilesMap={profilesMap}
          />
        ) : (
          <ClansTab 
            clansSearchTerm={clansSearchTerm}
            setClansSearchTerm={setClansSearchTerm}
            filteredClans={filteredClans}
            playersMap={playersMap}
          />
        )}
      </div>

      <style>{`
        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(53, 150, 46, 0.15) !important;
          border-color: #35962e !important;
        }
        .card {
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .card:hover {
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </main>
  );
}