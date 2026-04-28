"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
  } | null>(null);
  
  // Changed to an array to support multiple linked teams
  const [teams, setTeams] = useState<{ id: number; name: string; team_code: string }[]>([]);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const [previewTeam, setPreviewTeam] = useState<{ id: number; name: string; team_code: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please log in to view your profile.");
        return;
      }

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name, profile_pic")
        .eq("id", user.id)
        .single();
      
      if (profileError) throw profileError;

      // 2. Fetch all teams linked to this profile_id
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name, team_code")
        .eq("profile_id", user.id);

      if (teamError) throw teamError;

      setProfile(profileData);
      setUsername(profileData?.username || "");
      setDisplayName(profileData?.display_name || "");
      setProfilePic(profileData?.profile_pic || null);
      setTeams(teamData || []);

    } catch (err: any) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckTeamCode = async () => {
    if (!teamCodeInput.trim()) return;

    try {
      setSaving(true);
      const trimmedCode = teamCodeInput.trim().toUpperCase();

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name, team_code, profile_id")
        .eq("team_code", trimmedCode)
        .single();

      if (teamError || !teamData) {
        alert("Invalid Team Code! Please check and try again.");
        return;
      }

      if (teamData.profile_id) {
        alert("This team is already claimed by another player.");
        return;
      }

      setPreviewTeam(teamData);
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!previewTeam) return;

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update the team table directly
      const { error: updateError } = await supabase
        .from("teams")
        .update({ profile_id: user.id })
        .eq("id", previewTeam.id);

      if (updateError) throw updateError;

      setPreviewTeam(null);
      setTeamCodeInput("");
      fetchProfile(); // Refresh list and profile
    } catch (err: any) {
      alert(err.message || "Failed to join team.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelJoin = () => {
    setPreviewTeam(null);
  };

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim() || null,
          display_name: displayName.trim() || null,
          profile_pic: profilePic
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfile({ ...profile!, username, display_name: displayName, profile_pic: profilePic });
      setIsEditing(false);
      setActiveTab("welcome");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setProfilePic(data.publicUrl);
    } catch (err: any) {
      alert("Error uploading image: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Navbar />
      <div className="container mt-5 py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row g-4">
            {/* LEFT COLUMN */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-4 text-center mb-4" style={{ borderRadius: "15px" }}>
                <div className="mb-3">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="rounded-circle border" style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                  ) : (
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                         style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}>
                      {(displayName || username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h5 className="fw-bold mb-1">{profile?.display_name || "New Player"}</h5>
                <p className="text-muted small mb-3">@{profile?.username || "username"}</p>
                <button
                  className={`btn btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'} w-100 fw-bold`}
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setActiveTab("welcome");
                  }}
                >
                  {isEditing ? "Exit Editor" : "Edit Profile"}
                </button>
              </div>

              <div className="list-group shadow-sm border-0 mb-4" style={{ borderRadius: "15px", overflow: "hidden" }}>
                <div className="list-group-item bg-primary text-white border-0 fw-bold py-3">
                  Player Activity
                </div>
                <button
                  onClick={() => { setActiveTab("myteam"); setIsEditing(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'myteam' ? 'active' : ''}`}
                >
                  My Teams ⚽
                </button>
                <button
                  onClick={() => { setActiveTab("tournaments"); setIsEditing(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
                >
                  Tournaments Created
                </button>
                <button
                  onClick={() => { setActiveTab("predictions"); setIsEditing(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'predictions' ? 'active' : ''}`}
                >
                  Predictions
                </button>
              </div>

              <button
                className="btn btn-outline-danger w-100 fw-bold py-2 shadow-sm"
                style={{ borderRadius: "15px", borderWidth: "2px" }}
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                Sign Out
              </button>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-md-8">
              <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "15px", minHeight: "400px" }}>
                {isEditing ? (
                  <div>
                    <h5 className="fw-bold text-primary mb-4">Edit Profile</h5>
                    <div className="mb-4 text-center p-3 bg-light rounded border">
                      <p className="small fw-bold text-uppercase text-muted mb-2">Update Avatar</p>
                      <input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleFileChange} />
                      {saving && <div className="mt-2"><span className="spinner-border spinner-border-sm text-primary me-2"></span><span className="small text-primary">Uploading...</span></div>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-uppercase text-muted">Display Name</label>
                      <input className="form-control shadow-sm" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-uppercase text-muted">Username</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-light text-muted">@</span>
                        <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
                      </div>
                    </div>
                    <button className="btn btn-primary fw-bold w-100 py-2 shadow" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-center">
                    <div className="fade-in w-100">
                      {activeTab === "welcome" && (
                        <>
                          <h4 className="fw-bold text-primary">Welcome, {profile?.display_name || profile?.username}!</h4>
                          <p className="text-muted">Explore your stats using the tabs on the left.</p>
                        </>
                      )}

                      {activeTab === "myteam" && (
                        <div className="p-2">
                          {/* 1. LIST OF TEAMS */}
                          {teams.length > 0 && (
                            <div className="mb-5">
                              <h5 className="fw-bold text-start mb-3 text-muted text-uppercase small">Your Linked Squads</h5>
                              <div className="row g-3">
                                {teams.map((t) => (
                                  <div key={t.id} className="col-sm-6">
                                    <div className="card bg-primary text-white p-3 border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="text-start">
                                          <div className="fw-bold small opacity-75">Team Name</div>
                                          <h6 className="mb-1 fw-bold">{t.name}</h6>
                                          <span className="badge bg-white text-primary" style={{ fontSize: '0.7rem' }}>CODE: {t.team_code}</span>
                                        </div>
                                        <i className="bi bi-shield-check fs-2 opacity-50"></i>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 2. JOIN/LINK SECTION */}
                          {previewTeam ? (
                            <div className="card border-primary shadow-lg p-4" style={{ maxWidth: "500px", margin: "0 auto" }}>
                              <h4 className="fw-bold text-primary mb-3">Link this Team?</h4>
                              <div className="bg-light rounded p-4 mb-4 text-start">
                                <h5 className="fw-bold mb-2">{previewTeam.name}</h5>
                                <p className="mb-1 text-muted">Team Code:</p>
                                <div className="badge bg-primary text-white fs-5 px-4 py-2">{previewTeam.team_code}</div>
                              </div>
                              <div className="d-grid gap-3">
                                <button className="btn btn-primary btn-lg fw-bold" onClick={handleConfirmJoin} disabled={saving}>
                                  {saving ? "Linking..." : "Confirm Link"}
                                </button>
                                <button className="btn btn-outline-secondary" onClick={handleCancelJoin} disabled={saving}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-md mx-auto py-3">
                              <div className="text-center mb-4">
                                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                                  <i className="bi bi-plus-circle text-primary fs-3"></i>
                                </div>
                                <h4 className="fw-bold">Link a New Team</h4>
                                <p className="text-muted small">Enter a secret code to add another squad to your profile.</p>
                              </div>
                              <div className="input-group mb-3 shadow-sm border rounded-pill overflow-hidden">
                                <input
                                  type="text"
                                  className="form-control border-0 px-4"
                                  placeholder="ENTER CODE"
                                  value={teamCodeInput}
                                  onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
                                />
                                <button className="btn btn-primary px-4 fw-bold" onClick={handleCheckTeamCode} disabled={saving}>
                                  {saving ? "..." : "Link"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "tournaments" && <h5 className="text-muted border-bottom pb-2">Tournaments will appear here</h5>}
                      {activeTab === "predictions" && <h5 className="text-muted border-bottom pb-2">Predictions will appear here</h5>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .tab-btn { color: #495057; font-weight: 500; transition: all 0.2s; }
        .tab-btn:hover:not(.active) { background-color: #f1f3f5; color: #0d6efd; transform: translateX(5px); }
        .tab-btn.active { background-color: #0d6efd !important; color: white !important; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}