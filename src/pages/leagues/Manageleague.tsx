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
  short_intro: string;
  season: string;
  avatar_url?: string;
  rules?: string;
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

  const [leagueData, setLeagueData] = useState<League>({
    name: "",
    organizer: "",
    passkey: "",
    short_intro: "",
    season: "",
    avatar_url: "",
    rules: "",
  });

  const [tournamentPasskey, setTournamentPasskey] = useState("");
  const [linkedTournaments, setLinkedTournaments] = useState<Tournament[]>([]);
  const [uploading, setUploading] = useState(false);

  // --- IMAGE UPLOAD LOGIC ---
  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${activeLeagueId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'league-avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from("league-avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("league-avatars")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Update Local State
      setLeagueData((prev) => ({ ...prev, avatar_url: publicUrl }));

      // Update Database immediately for the avatar
      const { error: updateError } = await supabase
        .from("leagues")
        .update({ avatar_url: publicUrl })
        .eq("id", activeLeagueId);

      if (updateError) throw updateError;

      alert("AVATAR UPDATED SUCCESSFULLY");
    } catch (error: any) {
      alert("UPLOAD ERROR: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLinkTournament = useCallback(async () => {
    if (!tournamentPasskey || !activeLeagueId) return;

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("passkey", tournamentPasskey)
      .single();

    if (error || !data) return alert("INVALID TOURNAMENT PASSKEY");

    const isAlreadyLinkedLocally = linkedTournaments.some(t => t.id === data.id);
    if (isAlreadyLinkedLocally) {
      setTournamentPasskey("");
      return alert("ALREADY LINKED TO THIS LEAGUE.");
    }

    if (data.league_id && data.league_id !== activeLeagueId) {
      return alert(`ALREADY LINKED TO ANOTHER LEAGUE (ID: ${data.league_id})`);
    }

    const { error: updateError } = await supabase
      .from("tournaments")
      .update({ league_id: activeLeagueId })
      .eq("id", data.id);

    if (updateError) return alert("LINK FAILED: " + updateError.message);

    alert(`SUCCESSFULLY LINKED: ${data.name}`);
    setLinkedTournaments((prev) => [...prev, data]);
    setTournamentPasskey("");
  }, [tournamentPasskey, activeLeagueId, linkedTournaments]);

  useEffect(() => {
    if (!activeLeagueId) {
      navigate("/leaguelandingpage");
      return;
    }

    const fetchLeague = async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, organizer, passkey, short_intro, season, avatar_url, rules")
        .eq("id", activeLeagueId)
        .single();
      if (error) return console.error(error);

      setLeagueData({
        id: data.id,
        name: data.name,
        organizer: data.organizer,
        passkey: data.passkey || "",
        short_intro: data.short_intro || "",
        season: data.season || "",
        avatar_url: data.avatar_url,
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

    if (error) return alert("ERROR SAVING: " + error.message);
    alert("LEAGUE DATA SYNCHRONIZED.");
  };

  return (
    <div className="min-vh-100 bg-konami-dark text-white font-konami">
      <LeaguesNavbar />

      <div className="container py-4">
        {/* Header Section */}
        <div className="mb-4 d-flex align-items-center">
          <div className="avatar-frame me-3">
            <img 
              src={leagueData.avatar_url || "/cup.png"} 
              alt="League Avatar" 
              className="konami-img" 
            />
          </div>
          <div>
            <h3 className="m-0 italic fw-bold text-uppercase tracking-widest">{leagueData.name || "LOADING..."}</h3>
            <span className="text-konami-blue smaller fw-bold">ADMINISTRATION TERMINAL</span>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="accordion konami-accordion mb-4" id="leagueAccordion">
          
          {/* Section 1: Profile Details */}
          <div className="accordion-item bg-transparent border-primary">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed text-uppercase italic fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#details">
                League Profile Settings
              </button>
            </h2>
            <div id="details" className="accordion-collapse collapse" data-bs-parent="#leagueAccordion">
              <div className="accordion-body p-4">
                <div className="row g-3">
                  {/* Image Upload Input */}
                  <div className="col-12 mb-3">
                    <label className="konami-label">Update League Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="konami-input" 
                      onChange={handleUploadAvatar} 
                      disabled={uploading}
                    />
                    {uploading && <span className="smaller italic text-konami-blue">UPLOADING DATA...</span>}
                  </div>

                  <div className="col-md-6">
                    <label className="konami-label">League Name</label>
                    <input type="text" className="konami-input" name="name" value={leagueData.name} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="konami-label">Organizer</label>
                    <input type="text" className="konami-input" name="organizer" value={leagueData.organizer} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="konami-label">Passkey</label>
                    <input type="text" className="konami-input" name="passkey" value={leagueData.passkey} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label className="konami-label">Season</label>
                    <input type="text" className="konami-input" name="season" value={leagueData.season} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="konami-label">Short Intro</label>
                    <textarea className="konami-input" name="short_intro" value={leagueData.short_intro} onChange={handleChange} rows={2} />
                  </div>
                  <div className="col-12 text-end">
                    <button className="konami-badge-btn px-4" onClick={handleSaveLeague}>UPDATE SETTINGS</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Rules */}
          <div className="accordion-item bg-transparent border-primary">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed text-uppercase italic fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#rules">
                League Rules & Regulations
              </button>
            </h2>
            <div id="rules" className="accordion-collapse collapse" data-bs-parent="#leagueAccordion">
              <div className="accordion-body p-4">
                <textarea className="konami-input" name="rules" value={leagueData.rules} onChange={handleChange} rows={6} placeholder="DEFINE RULES..." />
                <div className="text-end mt-3">
                    <button className="konami-badge-btn px-4" onClick={handleSaveLeague}>SAVE RULES</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Tournaments Section */}
        <div className="mb-4">
          <h6 className="text-uppercase italic text-konami-blue mb-3 fw-bold tracking-widest">Linked Tournaments</h6>
          <div className="tournament-list">
            {linkedTournaments.length === 0 && <p className="smaller opacity-50">NO TOURNAMENTS LINKED</p>}
            {linkedTournaments.map((t) => (
              <div key={t.id} className="konami-row d-flex justify-content-between align-items-center p-3 mb-2">
                <div className="d-flex align-items-center">
                  <img src="/cup.png" alt="" width="20" className="me-3" />
                  <span className="fw-bold text-uppercase italic">{t.name}</span>
                </div>
                <span className="smaller text-konami-blue fw-bold">ID: {t.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Terminal */}
        <div className="konami-terminal p-4 mb-5">
          <label className="konami-label mb-3">Link New Tournament </label>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="konami-input flex-grow-1"
              value={tournamentPasskey}
              onChange={(e) => setTournamentPasskey(e.target.value)}
              placeholder="ENTER TOURNAMENT PASSKEY..."
              onKeyDown={(e) => e.key === "Enter" && handleLinkTournament()}
            />
            <button className="konami-badge-btn" onClick={handleLinkTournament}>LINK</button>
          </div>
        </div>

        <button className="btn btn-link text-danger fw-bold text-decoration-none p-0 smaller italic text-uppercase" onClick={() => { logoutFromLeague(); navigate("/leaguelandingpage"); }}>
          <i className="bi bi-power me-2"></i> Exit Management Session
        </button>
      </div>

      <style>{`
        .bg-konami-dark {
          background-color: #030a1a;
          background-image: radial-gradient(circle at 50% 50%, #051a3d 0%, #030a1a 100%);
        }
        .text-konami-blue { color: #58a6ff; }
        .italic { font-style: italic; }
        .tracking-widest { letter-spacing: 2px; }
        .smaller { font-size: 0.75rem; }

        .konami-accordion .accordion-item { border-radius: 0; background: transparent; border: 1px solid rgba(13, 110, 253, 0.3); margin-bottom: 5px; }
        .konami-accordion .accordion-button { background: rgba(13, 110, 253, 0.05); color: white; border-radius: 0; box-shadow: none; }
        .konami-accordion .accordion-button:not(.collapsed) { background: rgba(13, 110, 253, 0.15); color: #58a6ff; }
        .konami-accordion .accordion-button::after { filter: invert(1); }

        .konami-label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #58a6ff; margin-bottom: 5px; }
        .konami-input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #0d6efd; color: white; padding: 10px; font-size: 0.85rem; }
        .konami-input:focus { outline: none; border-color: white; box-shadow: 0 0 10px rgba(13, 110, 253, 0.3); }

        .konami-row { background: rgba(13, 110, 253, 0.05); border-left: 3px solid #0d6efd; transition: background 0.2s; }
        .konami-row:hover { background: rgba(13, 110, 253, 0.1); }

        .avatar-frame { width: 50px; height: 50px; border: 2px solid #0d6efd; transform: skew(-10deg); overflow: hidden; background: #000; }
        .konami-img { width: 100%; height: 100%; object-fit: cover; transform: skew(10deg) scale(1.1); }

        .konami-badge-btn {
          background: #0d6efd; color: white; border: none; font-weight: 900; font-size: 0.75rem; padding: 8px 20px;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
        }
        .konami-terminal { background: rgba(13, 110, 253, 0.03); border: 1px dashed rgba(13, 110, 253, 0.3); }
      `}</style>
    </div>
  );
}