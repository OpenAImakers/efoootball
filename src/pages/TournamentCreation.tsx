"use client";

import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginToTournament } from "../Utils/TournamentSession";

export default function CreateTournament() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form States
  const [name, setName] = useState("");
  const [tournamentType, setTournamentType] = useState("single_elimination");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [passkey, setPasskey] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [firstPrize, setFirstPrize] = useState("");
  const [secondPrize, setSecondPrize] = useState("");
  const [thirdPrize, setThirdPrize] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Banner Selection with Instant Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1 && !avatarFile) {
      setErrorMsg("Please select a tournament banner image.");
      return;
    }
    if (currentStep === 2 && (!name.trim() || !passkey.trim())) {
      setErrorMsg("Please provide both a Tournament Name and a Passkey.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

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
      
      <div className="container-fluid py-5" style={{ marginTop: "105px" }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-7">
            
            {/* Page Header */}
            <div className="text-center mb-4">
              <h1 className="display-6 fw-black mb-2 title-gradient">
                CREATE TOURNAMENT
              </h1>
              <p className="text-secondary small">Step-by-step arena setup</p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="d-flex justify-content-between mb-4 position-relative px-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="text-center z-1">
                  <div className={`step-circle ${currentStep >= step ? "step-active" : ""}`}>
                    {step}
                  </div>
                  <span className="step-label d-none d-sm-block mt-2">
                    {step === 1 && "Banner"}
                    {step === 2 && "Identity"}
                    {step === 3 && "Prizes"}
                    {step === 4 && "Rules & Launch"}
                  </span>
                </div>
              ))}
              <div className="step-progress-line"></div>
            </div>

            {/* Global Error Banner */}
            {errorMsg && (
              <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center bg-danger bg-opacity-10 text-danger mb-4 rounded-3">
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Form Glass Card */}
            <div className="card border-secondary border-opacity-25 shadow-lg glass-card">
              <div className="card-body p-4 p-md-5">

                {/* STEP 1: BANNER UPLOAD & PREVIEW */}
                {currentStep === 1 && (
                  <div className="step-content">
                    <h5 className="fw-bold text-white mb-3">Step 1: Upload Arena Banner</h5>
                    <div className="mb-4">
                      <label className="form-label text-info small text-uppercase tracking-wider fw-bold">
                        Choose Tournament Image
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="form-control bg-dark text-white border-secondary shadow-none custom-file-input" 
                      />
                    </div>

                    {/* Image Preview Box */}
                    {avatarPreview ? (
                      <div className="preview-container text-center mb-3">
                        <p className="text-white-50 small mb-2">Banner Preview:</p>
                        <img 
                          src={avatarPreview} 
                          alt="Banner Preview" 
                          className="img-fluid rounded-3 border border-secondary shadow-sm" 
                          style={{ maxHeight: "220px", objectFit: "cover", width: "100%" }}
                        />
                      </div>
                    ) : (
                      <div className="preview-placeholder text-center p-4 border border-dashed border-secondary rounded-3 text-secondary mb-3">
                        <i className="bi bi-image fs-1 d-block mb-1"></i>
                        <span className="small">No banner selected. Upload an image to view preview.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: NAME & SECURITY PASSKEY */}
                {currentStep === 2 && (
                  <div className="step-content">
                    <h5 className="fw-bold text-white mb-3">Step 2: Arena Identity & Security</h5>
                    
                    {/* Security Passkey Alert Box */}
                    <div className="alert border-warning bg-warning bg-opacity-10 text-warning p-3 mb-4 rounded-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="bi bi-shield-lock-fill fs-5 me-2"></i>
                        <strong className="text-uppercase tracking-wider fs-7">Important Passkey Warning</strong>
                      </div>
                      <p className="small mb-0 text-warning-50">
                        Ensure you save your passkey carefully. If lost, you will not be able to manage or recover your tournament!
                      </p>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-bold text-info small text-uppercase tracking-wider">
                          Arena / Tournament Name
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Moha Gamers Zone Championship" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="form-control bg-dark text-white border-secondary shadow-none py-2" 
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-warning small text-uppercase tracking-wider">
                          Password / Passkey
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. SecretPasskey123" 
                          value={passkey} 
                          onChange={(e) => setPasskey(e.target.value)} 
                          className="form-control bg-dark text-white border-secondary shadow-none py-2" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PRIZE POOL */}
                {currentStep === 3 && (
                  <div className="step-content">
                    <h5 className="fw-bold text-white mb-3">Step 3: Prize Pool Breakdown</h5>
                    <p className="text-white-50 small mb-4">Set prize amounts for top-tier finishers.</p>

                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label text-warning small fw-bold">1st Place Prize</label>
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary text-warning"><i className="bi bi-trophy-fill"></i></span>
                          <input type="number" placeholder="0" value={firstPrize} onChange={(e) => setFirstPrize(e.target.value)} className="form-control bg-dark text-white border-secondary shadow-none" />
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label text-light small fw-bold">2nd Place Prize</label>
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary text-light"><i className="bi bi-award-fill"></i></span>
                          <input type="number" placeholder="0" value={secondPrize} onChange={(e) => setSecondPrize(e.target.value)} className="form-control bg-dark text-white border-secondary shadow-none" />
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-bold" style={{ color: "#cd7f32" }}>3rd Place Prize</label>
                        <div className="input-group">
                          <span className="input-group-text bg-dark border-secondary" style={{ color: '#cd7f32' }}><i className="bi bi-award-fill"></i></span>
                          <input type="number" placeholder="0" value={thirdPrize} onChange={(e) => setThirdPrize(e.target.value)} className="form-control bg-dark text-white border-secondary shadow-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: FORMAT & TIMINGS */}
                {currentStep === 4 && (
                  <div className="step-content">
                    <h5 className="fw-bold text-white mb-3">Step 4: Format & Final Launch</h5>
                    
                    <div className="row g-3">
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

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-info small text-uppercase tracking-wider">Start Schedule</label>
                        <input 
                          type="datetime-local" 
                          value={startTime} 
                          onChange={(e) => setStartTime(e.target.value)} 
                          className="form-control bg-dark text-white border-secondary shadow-none inv-color" 
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-danger small text-uppercase tracking-wider">End Schedule</label>
                        <input 
                          type="datetime-local" 
                          value={endTime} 
                          onChange={(e) => setEndTime(e.target.value)} 
                          className="form-control bg-dark text-white border-secondary shadow-none inv-color" 
                        />
                      </div>

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
                    </div>
                  </div>
                )}

                {/* Step Controls */}
                <div className="d-flex justify-content-between align-items-center pt-4 mt-4 border-top border-secondary border-opacity-25">
                  {currentStep > 1 ? (
                    <button type="button" onClick={prevStep} className="btn btn-outline-secondary px-4 fw-bold">
                      <i className="bi bi-arrow-left me-1"></i> Back
                    </button>
                  ) : <div></div>}

                  {currentStep < 4 ? (
                    <button type="button" onClick={nextStep} className="btn btn-primary px-4 fw-bold">
                      Next Step <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleCreate} 
                      disabled={loading} 
                      className="btn btn-success px-4 py-2 fw-black text-uppercase tracking-wider shadow"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          LAUNCHING...
                        </>
                      ) : (
                        "Launch Arena"
                      )}
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .tracking-wider { letter-spacing: 1px; }
        .glass-card { background-color: #0f172a; border-radius: 16px; }

        .title-gradient {
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
          letter-spacing: 2px;
        }

        /* Stepper Styling */
        .step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1e293b;
          border: 2px solid #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #94a3b8;
          transition: all 0.3s ease;
        }

        .step-active {
          background: #2563eb;
          border-color: #60a5fa;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(37, 99, 235, 0.5);
        }

        .step-label {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .step-progress-line {
          position: absolute;
          top: 18px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: #334155;
          z-index: 0;
        }

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
      `}</style>
    </div>
  );
}