"use client";

import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginToTournament } from "../Utils/TournamentSession";

export default function CreateTournament() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tournamentType, setTournamentType] = useState("single_elimination");
  const [startTime, setStartTime] = useState("");
  const [passkey, setPasskey] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [firstPrize, setFirstPrize] = useState("");
  const [secondPrize, setSecondPrize] = useState("");
  const [thirdPrize, setThirdPrize] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      setErrorMsg("End time must be after the start time.");
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let avatarUrl = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('tournaments_avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('tournaments_avatars').getPublicUrl(fileName);
        avatarUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("tournaments")
        .insert([{
            name: name.trim(),
            tournament_type: tournamentType,
            start_time: startTime || null,
            end_time: endTime || null,
            is_active: isActive,
            created_by: user?.id,
            passkey: passkey.trim(),
            tournament_avatar: avatarUrl,
            first_place_prize: parseFloat(firstPrize) || 0,
            second_place_prize: parseFloat(secondPrize) || 0,
            third_place_prize: parseFloat(thirdPrize) || 0,
        }])
        .select().single();

      if (error) throw error;
      if (data) {
        loginToTournament(data.id, data.name);
        navigate("/tournament-list");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#020617", color: "#f8fafc" }}>
      <Navbar />
      
      <div className="container-fluid py-5" style={{ marginTop: "60px" }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            
            {/* Header Section */}
            <div className="text-center mb-4">
              <h1 className="display-6 fw-black mb-2" style={{ 
                background: "linear-gradient(to right, #60a5fa, #a78bfa)", 
                WebkitBackgroundClip: "text", 
                WebkitTextFillColor: "transparent",
                fontWeight: 900,
                letterSpacing: '2px'
              }}>
                SETUP TOURNAMENT
              </h1>
              <p className="text-secondary small">Configure your arena rules and prizes</p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center bg-danger bg-opacity-10 text-danger mb-4">
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Form Card */}
            <div className="card border-secondary border-opacity-25 shadow-lg" style={{ backgroundColor: "#0f172a", borderRadius: "16px" }}>
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleCreate} className="row g-4">
                  
                  {/* Banner Upload */}
                  <div className="col-12">
                    <label className="form-label fw-bold text-info small text-uppercase tracking-wider">
                      <i className="bi bi-image me-2"></i>Arena Banner
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} 
                      className="form-control bg-dark text-white border-secondary shadow-none custom-file-input" 
                    />
                  </div>

                  {/* Tournament Name */}
                  <div className="col-md-7">
                    <label className="form-label fw-bold text-info small text-uppercase tracking-wider">Arena Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Moha Gamers Zone" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      className="form-control bg-dark text-white border-secondary shadow-none py-2" 
                    />
                  </div>

                  {/* Passkey */}
                  <div className="col-md-5">
                    <label className="form-label fw-bold text-warning small text-uppercase tracking-wider">
                      <i className="bi bi-key-fill me-2"></i>Passkey
                    </label>
                    <input 
                      type="text" 
                      placeholder="Room Code" 
                      value={passkey} 
                      onChange={(e) => setPasskey(e.target.value)} 
                      required 
                      className="form-control bg-dark text-white border-secondary shadow-none py-2" 
                    />
                  </div>

                  {/* Prizes Row */}
                  <div className="col-12">
                    <label className="form-label fw-bold text-info small text-uppercase tracking-wider">Prize Pool</label>
                    <div className="row g-2">
                      <div className="col-4">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-dark border-secondary text-warning"><i className="bi bi-trophy-fill"></i></span>
                          <input type="number" placeholder="1st" value={firstPrize} onChange={(e) => setFirstPrize(e.target.value)} className="form-control bg-dark text-white border-secondary shadow-none" />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-dark border-secondary text-light"><i className="bi bi-award-fill"></i></span>
                          <input type="number" placeholder="2nd" value={secondPrize} onChange={(e) => setSecondPrize(e.target.value)} className="form-control bg-dark text-white border-secondary shadow-none" />
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-dark border-secondary" style={{color: '#cd7f32'}}><i className="bi bi-award-fill"></i></span>
                          <input type="number" placeholder="3rd" value={thirdPrize} onChange={(e) => setThirdPrize(e.target.value)} className="form-control bg-dark text-white border-secondary shadow-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Format Type */}
                  <div className="col-12">
                    <label className="form-label fw-bold text-info small text-uppercase tracking-wider">Tournament Format</label>
                    <select 
                      value={tournamentType} 
                      onChange={(e) => setTournamentType(e.target.value)} 
                      className="form-select bg-dark text-white border-secondary shadow-none py-2"
                    >
                      <option value="single_elimination">Single Elimination (Knockout)</option>
                      <option value="round_robin_single">Round Robin (Single)</option>
                      <option value="round_robin_double">Round Robin (Double)</option>
                      <option value="double_elimination">Double Elimination</option>
                    </select>
                  </div>

                  {/* Dates Row */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-info small text-uppercase tracking-wider">
                      <i className="bi bi-calendar-event me-2"></i>Starts
                    </label>
                    <input 
                      type="datetime-local" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)} 
                      className="form-control bg-dark text-white border-secondary shadow-none inv-color" 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-danger small text-uppercase tracking-wider">
                      <i className="bi bi-calendar-check me-2"></i>Ends
                    </label>
                    <input 
                      type="datetime-local" 
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)} 
                      className="form-control bg-dark text-white border-secondary shadow-none inv-color" 
                    />
                  </div>

                  {/* Live Checkbox */}
                  <div className="col-12 mt-3">
                    <div className="form-check form-switch p-3 bg-black bg-opacity-25 rounded border border-secondary border-opacity-10">
                      <input 
                        className="form-check-input ms-0 me-3" 
                        type="checkbox" 
                        role="switch" 
                        id="liveSwitch" 
                        checked={isActive} 
                        onChange={(e) => setIsActive(e.target.checked)} 
                      />
                      <label className="form-check-label fw-bold text-white small" htmlFor="liveSwitch" style={{ cursor: 'pointer' }}>
                        SET TOURNAMENT TO LIVE IMMEDIATELY
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="col-12 pt-3">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="btn btn-primary w-100 py-3 fw-black text-uppercase tracking-wider shadow"
                      style={{ 
                        borderRadius: "12px", 
                        fontSize: "1rem", 
                        fontWeight: 900,
                        background: "linear-gradient(45deg, #2563eb, #7c3aed)",
                        border: "none"
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          INITIALIZING...
                        </>
                      ) : (
                        "Launch Arena"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .tracking-wider { letter-spacing: 1px; }
        
        /* Style for dark mode date inputs */
        .inv-color::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }

        .form-control:focus, .form-select:focus {
            background-color: #1e293b;
            border-color: #60a5fa;
            color: #fff;
        }

        .custom-file-input::file-selector-button {
            background-color: #334155;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-right: 15px;
            cursor: pointer;
        }

        .custom-file-input::file-selector-button:hover {
            background-color: #475569;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.4) !important;
            transition: all 0.2s;
        }
      `}</style>
    </div>
  );
}