"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../supabase";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const WORKER_URL = 'https://posts-api.unscriptedusa.workers.dev';

interface Clan {
  id: string;
  clan_name: string;
  clan_avatar: string;
  created_by: string;
  created_at: string;
}

interface ClanPlayer {
  id: string;
  name: string;
  player_avatar: string;
  age: number;
  place: string;
  clan_id: string;
  created_at: string;
  user_id?: string;
  gender: string;
}

export default function SpecificClanRegistration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [clan, setClan] = useState<Clan | null>(null);
  const [existingPlayers, setExistingPlayers] = useState<ClanPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasRegistered, setHasRegistered] = useState(false);
  
  // Form state
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [playerPlace, setPlayerPlace] = useState("");
  const [playerGender, setPlayerGender] = useState("Male");
  const [playerAvatar, setPlayerAvatar] = useState<File | null>(null);
  const [playerAvatarPreview, setPlayerAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isMounted = useRef(true);

  // Get current user only ONCE on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted.current) {
        setCurrentUser(user);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch data is now strictly dependent ONLY on the clan ID
  const fetchClanAndPlayers = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      // Fetch clan details
      const { data: clanData, error: clanError } = await supabase
        .from("clans")
        .select("*")
        .eq("id", id)
        .single();
      
      if (clanError) throw clanError;
      setClan(clanData);
      
      // Fetch existing players in this clan
      const { data: playersData, error: playersError } = await supabase
        .from("clan_players")
        .select("*")
        .eq("clan_id", id)
        .order("created_at", { ascending: false });
      
      if (playersError) throw playersError;
      setExistingPlayers(playersData || []);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load clan information");
      navigate("/registerclans");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [id, navigate]);

  // Run the fetch when the component mounts or ID changes
  useEffect(() => {
    isMounted.current = true;
    fetchClanAndPlayers();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchClanAndPlayers]);

  // Separate effect to compute registration state only when players list or user ID actually changes
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (currentUserId && existingPlayers.length > 0) {
      const userRegistered = existingPlayers.some(player => player.user_id === currentUserId);
      setHasRegistered(!!userRegistered);
    }
  }, [currentUserId, existingPlayers]);

  // Cleanup blob URLs on unmount safely
  useEffect(() => {
    return () => {
      if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(playerAvatarPreview);
      }
    };
  }, [playerAvatarPreview]);

  const uploadImageToWorker = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadRes = await fetch(WORKER_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadRes.ok) throw new Error('Image upload failed');
    const data = await uploadRes.json();
    return data.image_url;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(playerAvatarPreview);
      }
      
      setPlayerAvatar(file);
      setPlayerAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(playerAvatarPreview);
    }
    setPlayerAvatar(null);
    setPlayerAvatarPreview(null);
    
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please login to register");
      navigate("/login");
      return;
    }
    
    if (hasRegistered) {
      alert("You have already registered for this clan!");
      return;
    }
    
    if (!playerName.trim()) {
      alert("Please enter player name");
      return;
    }
    
    if (!playerAge) {
      alert("Please enter player age");
      return;
    }
    
    if (!playerPlace.trim()) {
      alert("Please enter player place/location");
      return;
    }
    
    setSubmitting(true);
    
    try {
      let finalAvatarUrl = "";
      
      if (playerAvatar) {
        setUploading(true);
        try {
          finalAvatarUrl = await uploadImageToWorker(playerAvatar);
        } catch (uploadError) {
          alert("Failed to upload player avatar. Please try again.");
          setSubmitting(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }
      
      const { error: insertError } = await supabase
        .from("clan_players")
        .insert([
          {
            name: playerName.trim(),
            player_avatar: finalAvatarUrl,
            age: parseInt(playerAge),
            place: playerPlace.trim(),
            clan_id: id,
            user_id: currentUser.id,
            gender: playerGender,
          },
        ]);
      
      if (insertError) throw insertError;
      
      setPlayerName("");
      setPlayerAge("");
      setPlayerPlace("");
      setPlayerGender("Male");
      if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(playerAvatarPreview);
      }
      setPlayerAvatar(null);
      setPlayerAvatarPreview(null);
      
      await fetchClanAndPlayers();
      
      alert(`Successfully registered ${playerName} to ${clan?.clan_name}!`);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(error.message || "Failed to register player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ marginTop: "68px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!clan) {
    return (
      <>
        <Navbar />
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ marginTop: "68px" }}>
          <div className="text-center">
            <h4>Clan not found</h4>
            <button onClick={() => navigate("/registerclans")} className="btn btn-primary mt-3">
              Back to Clans
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-vh-100" style={{ backgroundColor: "#f0f2f5", marginTop: "68px" }}>
        <div className="container py-4">
          <button onClick={() => navigate("/register")} className="btn btn-outline-secondary mb-4">
            ← Back
          </button>

          <div className="card mb-4">
            <div className="row g-0">
              <div className="col-md-3 text-center p-4">
                {clan.clan_avatar ? (
                  <img
                    src={clan.clan_avatar}
                    alt={clan.clan_name}
                    style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <div style={{ fontSize: "60px" }}>🏰</div>
                )}
              </div>
              <div className="col-md-9">
                <div className="card-body">
                  <h2>{clan.clan_name}</h2>
                  <p className="text-muted">Created: {new Date(clan.created_at).toLocaleDateString()}</p>
                  <p>Total Players: {existingPlayers.length}</p>
                </div>
              </div>
            </div>
          </div>

          {hasRegistered ? (
            <div className="alert alert-success text-center">
              <h4>✓ You are registered for this clan!</h4>
            </div>
          ) : (
            <div className="row">
              <div className="col-md-5">
                <div className="card">
                  <div className="card-body">
                    <h4 className="mb-3">Register as Player</h4>
                    
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Avatar (Must Upload a passport sized Photo)</label>
                        <div className="border p-3 text-center">
                          {playerAvatarPreview ? (
                            <div className="position-relative d-inline-block">
                              <img 
                                src={playerAvatarPreview} 
                                alt="Preview" 
                                style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "50%" }} 
                              />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="btn btn-sm btn-danger position-absolute top-0 end-0"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageSelect} 
                                className="d-none" 
                                id="avatar-input" 
                              />
                              <label htmlFor="avatar-input" className="btn btn-outline-primary">
                                Upload Avatar
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Player Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Age *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={playerAge}
                          onChange={(e) => setPlayerAge(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Location *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={playerPlace}
                          onChange={(e) => setPlayerPlace(e.target.value)}
                          required
                        />
                      </div>

                      {/* Gender Radio Group Selection */}
                      <div className="mb-3">
                        <label className="form-label d-block">Gender *</label>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="playerGender"
                            id="genderMale"
                            value="Male"
                            checked={playerGender === "Male"}
                            onChange={(e) => setPlayerGender(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor="genderMale">Male</label>
                        </div>
                        <div className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="playerGender"
                            id="genderFemale"
                            value="Female"
                            checked={playerGender === "Female"}
                            onChange={(e) => setPlayerGender(e.target.value)}
                          />
                          <label className="form-check-label" htmlFor="genderFemale">Female</label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={submitting || uploading}
                      >
                        {submitting ? "Registering..." : uploading ? "Uploading..." : "Register"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-md-7">
                <div className="card">
                  <div className="card-body">
                    <h4>Registered Players ({existingPlayers.length})</h4>
                    <hr />
                    {existingPlayers.length === 0 ? (
                      <p className="text-muted text-center">No players yet</p>
                    ) : (
                      <div className="row">
                        {existingPlayers.map((player) => (
                          <div key={player.id} className="col-md-6 mb-3">
                            <div className="d-flex gap-2 align-items-center p-2 border rounded">
                              {player.player_avatar ? (
                                <img
                                  src={player.player_avatar}
                                  alt={player.name}
                                  style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
                                />
                              ) : (
                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px" }}>
                                  👤
                                </div>
                              )}
                              <div>
                                <strong>{player.name}</strong>
                                <div className="small text-muted">
                                  Age: {player.age} | {player.gender || "Male"}
                                </div>
                                <div className="small text-muted">📍 {player.place}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}