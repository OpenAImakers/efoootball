"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
    team_id: number | null;
  } | null>(null);
  const [team, setTeam] = useState<{ name: string; team_code: string } | null>(null);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // New state for team preview / confirmation
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
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name, profile_pic, team_id, teams(name, team_code)")
        .eq("id", user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(data);
      setUsername(data?.username || "");
      setDisplayName(data?.display_name || "");
      setProfilePic(data?.profile_pic || null);
     
      if (data?.teams) {
        setTeam(data.teams as any);
      }
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
        .select("id, name, team_code")
        .eq("team_code", trimmedCode)
        .single();

      if (teamError || !teamData) {
        alert("Invalid Team Code! Please check and try again.");
        return;
      }

      // Show preview instead of joining immediately
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

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ team_id: previewTeam.id })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Success
      setTeam({ name: previewTeam.name, team_code: previewTeam.team_code });
      setPreviewTeam(null);
      setTeamCodeInput("");
      fetchProfile(); // just in case
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
            {/* LEFT COLUMN unchanged */}
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
                  My Team ⚽
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
                  // Editing form unchanged
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
                        <div className="p-4">
                          {team ? (
                            <div className="card bg-primary text-white p-5 border-0 shadow" style={{ borderRadius: "20px" }}>
                              <i className="bi bi-shield-shaded display-1 mb-3"></i>
                              <h2 className="fw-bold">{team.name}</h2>
                              <p className="opacity-75">Your Official Squad</p>
                              <div className="badge bg-white text-primary p-2">CODE: {team.team_code}</div>
                            </div>
                          ) : previewTeam ? (
                            // ── TEAM PREVIEW / CONFIRMATION UI ──
                            <div className="card border-primary shadow-lg p-4" style={{ maxWidth: "500px", margin: "0 auto" }}>
                              <h4 className="fw-bold text-primary mb-3">Join Team?</h4>
                              <div className="bg-light rounded p-4 mb-4 text-start">
                                <h5 className="fw-bold mb-2">{previewTeam.name}</h5>
                                <p className="mb-1 text-muted">Team Code:</p>
                                <div className="badge bg-primary text-white fs-5 px-4 py-2">
                                  {previewTeam.team_code}
                                </div>
                              </div>
                              <div className="d-grid gap-3">
                                <button
                                  className="btn btn-primary btn-lg fw-bold"
                                  onClick={handleConfirmJoin}
                                  disabled={saving}
                                >
                                  {saving ? "Joining..." : "Yes, Join Team"}
                                </button>
                                <button
                                  className="btn btn-outline-secondary btn-lg"
                                  onClick={handleCancelJoin}
                                  disabled={saving}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Normal join form
                            <div className="max-w-md mx-auto">
                              <h4 className="fw-bold mb-3">Not Linked to a Team</h4>
                              <p className="text-muted mb-4">Enter your team's secret code to join the action.</p>
                              <div className="input-group mb-3 shadow-sm">
                                <input
                                  type="text"
                                  className="form-control form-control-lg text-center fw-bold"
                                  placeholder="ENTER CODE (e.g. ARS123)"
                                  value={teamCodeInput}
                                  onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
                                />
                                <button
                                  className="btn btn-primary px-4 fw-bold"
                                  onClick={handleCheckTeamCode}
                                  disabled={saving}
                                >
                                  {saving ? "Checking..." : "Preview Team"}
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
        .tab-btn { color: #495057; font-weight: 500; }
        .tab-btn:hover:not(.active) { background-color: #e9ecef; color: #0d6efd; }
        .tab-btn.active { background-color: #0d6efd !important; color: white !important; }
        .fade-in { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}