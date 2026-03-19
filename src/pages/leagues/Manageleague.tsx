"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getActiveLeague, logoutFromLeague } from "../../Utils/LeagueSesssion";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import LeaguesNavbar from "./Leaguenav";

interface League {
  id?: number;
  name: string;
  organizer: string;
  passkey: string;
  rules: string;
}

interface Tournament {
  id: number;
  name: string;
  passkey: string;
  league_id?: number;
  rules?: string;
}

export default function LeagueManagement() {
  const navigate = useNavigate();
  const activeLeague = getActiveLeague();
  const activeLeagueId = activeLeague?.id;

  const [editMode, setEditMode] = useState(false);
  const [leagueData, setLeagueData] = useState<League>({
    name: "",
    organizer: "",
    passkey: "",
    rules: "",
  });

  const [tournamentPasskey, setTournamentPasskey] = useState("");
  const [linkedTournaments, setLinkedTournaments] = useState<Tournament[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define handleLinkTournament with useCallback
  const handleLinkTournament = useCallback(async () => {
    if (!tournamentPasskey || !activeLeagueId) return;

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("passkey", tournamentPasskey)
      .single();

    if (error || !data) return alert("Invalid tournament passkey");

    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ league_id: activeLeagueId })
      .eq("id", data.id);

    if (updateError) return alert("Failed to link: " + updateError.message);

    alert(`Linked: ${data.name}`);
    setLinkedTournaments((prev) => [...prev, data]);
    setTournamentPasskey("");
  }, [tournamentPasskey, activeLeagueId]);

  // Effect for fetching data
  useEffect(() => {
    if (!activeLeagueId) {
      navigate("/leaguelandingpage");
      return;
    }

    const fetchLeague = async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", activeLeagueId)
        .single();
      if (error) return console.error(error);

      setLeagueData({
        id: data.id,
        name: data.name,
        organizer: data.organizer,
        passkey: data.passkey || "",
        rules: data.rules || "",
      });
    };

    const fetchTournaments = async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("league_id", activeLeagueId)
        .order("created_at", { ascending: true });

      if (error) return console.error(error);
      setLinkedTournaments(data || []);
    };

    fetchLeague();
    fetchTournaments();
  }, [activeLeagueId, navigate]);

  // Effect for Enter Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && tournamentPasskey) {
        handleLinkTournament();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tournamentPasskey, handleLinkTournament]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeagueData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveLeague = async () => {
    if (!activeLeagueId) return;
    const { error } = await supabase
      .from("leagues")
      .update(leagueData)
      .eq("id", activeLeagueId);

    if (error) return alert("Error saving league: " + error.message);
    alert("League updated successfully!");
    setEditMode(false);
  };

  return (
    <div className="min-vh-100 bg-white">
      <LeaguesNavbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-end mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-black text-primary m-0">{leagueData.name.toUpperCase() || "LOADING..."}</h2>
            <p className="text-muted small m-0 uppercase tracking-widest">Organizer: {leagueData.organizer}</p>
          </div>
          <button 
            className={`btn btn-sm ${editMode ? 'btn-dark' : 'btn-outline-primary'} fw-bold`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "CANCEL" : "EDIT PROFILE"}
          </button>
        </div>

        {editMode && (
          <div className="card border-primary mb-4 shadow-sm">
            <div className="card-body bg-light">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="small fw-bold text-uppercase">League Name</label>
                  <input type="text" className="form-control" name="name" value={leagueData.name} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="small fw-bold text-uppercase">Organizer</label>
                  <input type="text" className="form-control" name="organizer" value={leagueData.organizer} onChange={handleChange} />
                </div>
                <div className="col-md-12">
                  <label className="small fw-bold text-uppercase">Passkey</label>
                  <input type="text" className="form-control" name="passkey" value={leagueData.passkey} onChange={handleChange} />
                </div>
                <div className="col-md-12">
                  <label className="small fw-bold text-uppercase">Rules / Notes</label>
                  <textarea className="form-control" name="rules" value={leagueData.rules} onChange={handleChange} rows={3} />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary w-100 fw-bold" onClick={handleSaveLeague}>UPDATE LEAGUE DETAILS</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <h5 className="fw-bold mb-3 d-flex align-items-center">
            <i className="bi bi-trophy me-2 text-primary"></i> LINKED TOURNAMENTS
          </h5>
          <div className="tournament-scroller d-flex gap-3 overflow-auto pb-3">
            {linkedTournaments.map((t, idx) => (
              <div 
                key={t.id} 
                className={`t-card p-3 border rounded-3 transition-all ${selectedIndex === idx ? 'active-t' : ''}`}
                onClick={() => setSelectedIndex(idx)}
              >
                <img src="/cup.png" alt="" style={{ width: '30px' }} className="mb-2" />
                <div className="fw-bold small text-uppercase truncate">{t.name}</div>
                <div className="text-primary smaller fw-bold mt-1">ID: {t.id}</div>
              </div>
            ))}
            <div className="t-card add-card p-3 border border-dashed rounded-3 d-flex flex-column align-items-center justify-content-center">
               <i className="bi bi-plus-circle h4 m-0 text-muted"></i>
               <span className="smaller fw-bold text-muted">NEW</span>
            </div>
          </div>
        </div>

        <div className="bg-light p-4 rounded-4 border">
          <label className="fw-bold small text-uppercase mb-2">Connect New Tournament</label>
          <div className="input-group input-group-lg shadow-sm">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-key text-primary"></i></span>
            <input
              type="text"
              className="form-control border-start-0"
              value={tournamentPasskey}
              onChange={(e) => setTournamentPasskey(e.target.value)}
              placeholder="ENTER PASSKEY & PRESS ENTER..."
            />
            <button className="btn btn-primary px-4 fw-bold" onClick={handleLinkTournament}>LINK</button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-top">
          <button className="btn btn-link text-danger fw-bold text-decoration-none p-0" onClick={logoutFromLeague}>
            <i className="bi bi-box-arrow-left me-2"></i> EXIT MANAGEMENT SESSION
          </button>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; letter-spacing: -1px; }
        .uppercase { text-transform: uppercase; }
        .tracking-widest { letter-spacing: 2px; }
        .smaller { font-size: 0.75rem; }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
        .tournament-scroller { scrollbar-width: none; -ms-overflow-style: none; }
        .tournament-scroller::-webkit-scrollbar { display: none; }
        .t-card { min-width: 160px; background: white; cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
        .t-card:hover { border-color: #0d6efd; transform: translateY(-3px); }
        .active-t { border: 2px solid #0d6efd !important; background: #f0f7ff; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15); }
        .add-card { border-style: dashed !important; background: transparent; }
        .border-dashed { border-style: dashed !important; border-width: 2px !important; }
        .transition-all { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
}