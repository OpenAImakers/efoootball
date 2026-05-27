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
  const [userPlayerData, setUserPlayerData] = useState<ClanPlayer | null>(null);
  const [isMissingRequiredFields, setIsMissingRequiredFields] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);
  
  // Form state
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [playerPlace, setPlayerPlace] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState<File | null>(null);
  const [playerAvatarPreview, setPlayerAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [, setIsEditingMode] = useState(false);

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

  // Check registration status and missing fields
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (currentUserId && existingPlayers.length > 0) {
      const userPlayer = existingPlayers.find(player => player.user_id === currentUserId);
      
      if (userPlayer) {
        setHasRegistered(true);
        setUserPlayerData(userPlayer);
        
        // Check for missing required fields
        const missingFields: string[] = [];
        
        if (!userPlayer.player_avatar || userPlayer.player_avatar === "") {
          missingFields.push("Avatar Photo");
        }
        if (!userPlayer.name || userPlayer.name.trim() === "") {
          missingFields.push("Player Name");
        }
        if (!userPlayer.age || userPlayer.age <= 0) {
          missingFields.push("Age");
        }
        if (!userPlayer.place || userPlayer.place.trim() === "") {
          missingFields.push("Location");
        }
        
        setMissingFieldsList(missingFields);
        const hasMissingFields = missingFields.length > 0;
        setIsMissingRequiredFields(hasMissingFields);
        
        // If there are missing fields, automatically enable editing mode
        if (hasMissingFields) {
          setIsEditingMode(true);
          // Pre-fill form with existing data
          setPlayerName(userPlayer.name || "");
          setPlayerAge(userPlayer.age?.toString() || "");
          setPlayerPlace(userPlayer.place || "");
          // Note: Avatar preview can't be pre-filled for security reasons
        } else {
          setIsEditingMode(false);
        }
      } else {
        setHasRegistered(false);
        setUserPlayerData(null);
        setIsMissingRequiredFields(false);
        setMissingFieldsList([]);
        setIsEditingMode(true); // Enable editing for new registration
      }
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

  const validatePassportPhoto = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setAvatarError("Please upload an image file");
      return false;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image size should be less than 5MB");
      return false;
    }

    setAvatarError("");
    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validatePassportPhoto(file)) {
        e.target.value = '';
        return;
      }

      if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(playerAvatarPreview);
      }
      
      setPlayerAvatar(file);
      setPlayerAvatarPreview(URL.createObjectURL(file));
      setAvatarError("");
    }
  };

  const handleRemoveImage = () => {
    if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(playerAvatarPreview);
    }
    setPlayerAvatar(null);
    setPlayerAvatarPreview(null);
    setAvatarError("");
    
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please login to update");
      navigate("/login");
      return;
    }
    
    if (!userPlayerData) {
      alert("No registration found to update");
      return;
    }
    
    // Check if updating is allowed (only if missing required fields)
    if (!isMissingRequiredFields) {
      alert("⚠️ Your registration is complete. No further edits are allowed!");
      return;
    }
    
    // Validate all fields are now filled
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
    
    // Make avatar mandatory if it's missing
    if (!userPlayerData.player_avatar && !playerAvatar) {
      alert("⚠️ Avatar photo is mandatory! Please upload a passport-style photo for gaming identification.");
      return;
    }
    
    setSubmitting(true);
    
    try {
      let finalAvatarUrl = userPlayerData.player_avatar || "";
      
      // Upload new avatar if provided
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
      
      // Update the existing record
      const { error: updateError } = await supabase
        .from("clan_players")
        .update({
          name: playerName.trim(),
          player_avatar: finalAvatarUrl,
          age: parseInt(playerAge),
          place: playerPlace.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userPlayerData.id)
        .eq("user_id", currentUser.id);
      
      if (updateError) throw updateError;
      
      // Clear form
      setPlayerName("");
      setPlayerAge("");
      setPlayerPlace("");
      if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(playerAvatarPreview);
      }
      setPlayerAvatar(null);
      setPlayerAvatarPreview(null);
      
      await fetchClanAndPlayers();
      
      alert(`✅ Successfully updated your registration!\n\n⚠️ IMPORTANT: Now that all required fields are complete, no further edits will be allowed.`);
      
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error.message || "Failed to update registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please login to register");
      navigate("/login");
      return;
    }
    
    if (hasRegistered && !isMissingRequiredFields) {
      alert("You have already completed registration for this clan!");
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
    
    // Make avatar mandatory
    if (!playerAvatar) {
      alert("⚠️ Avatar photo is mandatory! Please upload a passport-style photo for gaming identification.");
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
            registered_at: new Date().toISOString(),
          },
        ]);
      
      if (insertError) throw insertError;
      
      setPlayerName("");
      setPlayerAge("");
      setPlayerPlace("");
      if (playerAvatarPreview && playerAvatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(playerAvatarPreview);
      }
      setPlayerAvatar(null);
      setPlayerAvatarPreview(null);
      
      await fetchClanAndPlayers();
      
      alert(`✅ Successfully registered ${playerName} to ${clan?.clan_name}!\n\n⚠️ IMPORTANT: Registration details cannot be edited after this point.`);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(error.message || "Failed to register player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = isMissingRequiredFields ? handleUpdate : handleNewRegistration;

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

  // Determine what to show
  const showRegistrationForm = !hasRegistered || (hasRegistered && isMissingRequiredFields);
  const showCompleteAlert = hasRegistered && !isMissingRequiredFields;

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

          {showCompleteAlert && (
            <div className="alert alert-danger text-center" role="alert">
              <h4>✓ YOU ARE FULLY REGISTERED FOR THIS CLAN!</h4>
              <p className="mb-0 mt-2">
                <strong>Registration is complete and cannot be modified or edited.</strong><br />
                Your profile has all required information. No further changes are allowed.
              </p>
            </div>
          )}

          {isMissingRequiredFields && hasRegistered && (
            <div className="alert alert-danger text-center" role="alert">
              <h4>⚠️ INCOMPLETE REGISTRATION DETECTED!</h4>
              <p className="mb-0 mt-2">
                <strong>You are missing the following required fields:</strong><br />
                {missingFieldsList.map(field => (
                  <span key={field} className="badge bg-danger me-1 mt-2">❌ {field}</span>
                ))}
                <br /><br />
                Please complete your registration below. <strong>This is your only chance to update your details.</strong> Once completed, no further edits will be allowed.
              </p>
            </div>
          )}

          {showRegistrationForm ? (
            <div className="row">
              <div className="col-md-5">
                <div className="card">
                  <div className="card-body">
                    <h4 className="mb-3">
                      {isMissingRequiredFields ? "Complete Your Registration" : "Register as Player"}
                    </h4>
                    
                    {isMissingRequiredFields && (
                      <div className="alert alert-warning" role="alert">
                        <strong>⚠️ Action Required:</strong> Please provide all missing information below. This is your final opportunity to update your registration.
                      </div>
                    )}

                    {!isMissingRequiredFields && (
                      <div className="alert alert-info" role="alert">
                        <strong>⚠️ Important:</strong> Registration details cannot be edited after submission. Please ensure all information is correct before registering.
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">
                          Avatar Photo <span className="text-danger">*Mandatory</span>
                        </label>
                        <div className="border p-3 text-center">
                          {(playerAvatarPreview || (userPlayerData?.player_avatar && isMissingRequiredFields)) ? (
                            <div className="position-relative d-inline-block">
                              <img 
                                src={playerAvatarPreview || userPlayerData?.player_avatar} 
                                alt="Preview" 
                                style={{ width: "120px", height: "150px", objectFit: "cover", border: "2px solid #ddd", borderRadius: "4px" }} 
                              />
                              {(!userPlayerData?.player_avatar || isMissingRequiredFields) && (
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                  style={{ transform: "translate(50%, -50%)" }}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="file" 
                                accept="image/jpeg,image/png,image/jpg" 
                                onChange={handleImageSelect} 
                                className="d-none" 
                                id="avatar-input" 
                                required={!userPlayerData?.player_avatar}
                              />
                              <label htmlFor="avatar-input" className="btn btn-outline-primary">
                                📸 Upload Passport-Style Photo
                              </label>
                            </div>
                          )}
                          {(!userPlayerData?.player_avatar && !playerAvatarPreview) && (
                            <div className="text-danger mt-2 small">⚠️ Avatar is required</div>
                          )}
                        </div>
                        {avatarError && (
                          <div className="text-danger mt-2 small">{avatarError}</div>
                        )}
                        <small className="text-muted d-block mt-2">
                          📸 <strong>Passport-style photo required for gaming identification</strong><br />
                          • Clear, front-facing photo<br />
                          • Plain background preferred<br />
                          • Max size: 5MB (JPG or PNG)<br />
                          • This photo will be visible to all clan members
                        </small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Player Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="Enter your in-game name"
                          required
                          disabled={!isMissingRequiredFields && hasRegistered}
                        />
                        <small className="text-muted">This will be your display name in the clan</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Age <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          value={playerAge}
                          onChange={(e) => setPlayerAge(e.target.value)}
                          placeholder="Enter your age"
                          min="13"
                          max="100"
                          required
                          disabled={!isMissingRequiredFields && hasRegistered}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Location <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={playerPlace}
                          onChange={(e) => setPlayerPlace(e.target.value)}
                          placeholder="City, Country"
                          required
                          disabled={!isMissingRequiredFields && hasRegistered}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={submitting || uploading}
                      >
                        {submitting ? "Processing..." : uploading ? "Uploading Photo..." : (isMissingRequiredFields ? "✓ Complete Registration" : "✓ Register")}
                      </button>

                      {isMissingRequiredFields && (
                        <div className="alert alert-danger mt-3 mb-0 small">
                          <strong>⚠️ FINAL NOTICE:</strong> After completing this form with all required fields, your registration will be <strong>permanently locked</strong> and no further edits will be allowed.
                        </div>
                      )}

                      {!isMissingRequiredFields && !hasRegistered && (
                        <div className="alert alert-warning mt-3 mb-0 small">
                          <strong>⚠️ Final Registration Notice:</strong> By clicking "Register", you confirm that all information is accurate. <strong>No edits or changes will be allowed after submission.</strong>
                        </div>
                      )}
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
                                  style={{ width: "50px", height: "60px", borderRadius: "4px", objectFit: "cover" }}
                                />
                              ) : (
                                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: "50px", height: "60px" }}>
                                  👤
                                </div>
                              )}
                              <div>
                                <strong>{player.name || "No name"}</strong>
                                <div className="small text-muted">
                                  Age: {player.age || "?"} | 📍 {player.place || "No location"}
                                  {!player.player_avatar && <span className="badge bg-danger ms-2">Missing Avatar!</span>}
                                </div>
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
          ) : null}
        </div>
      </main>
    </>
  );
}