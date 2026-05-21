"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../supabase";
import Navbar from "../../components/Navbar";
import WelcomeTab from "./components/WelcomeTab";
import AccountTab from "./components/AccountTab";
import MyTeamTab from "./components/MyTeamTab";
import TournamentsTab from "./components/TournamentsTab";
import PredictionsTab from "./components/PredictionsTab";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
  } | null>(null);
  
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Cache ref to prevent multiple fetches
  const fetchedRef = useRef(false);
  const profileCacheRef = useRef<any>(null);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && profileCacheRef.current) {
      const cached = profileCacheRef.current;
      setProfile(cached.profile);
      setTeams(cached.teams);
      setUsername(cached.username);
      setDisplayName(cached.displayName);
      setProfilePic(cached.profilePic);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please log in to view your profile.");
        return;
      }

      // Fetch profile and teams in parallel for better performance
      const [profileResult, teamResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, display_name, profile_pic")
          .eq("id", user.id)
          .single(),
        supabase
          .from("teams")
          .select("id, name")
          .eq("profile_id", user.id)
      ]);

      if (profileResult.error) throw profileResult.error;
      if (teamResult.error) throw teamResult.error;

      const profileData = profileResult.data;
      const teamData = teamResult.data;

      // Cache the results
      profileCacheRef.current = {
        profile: profileData,
        teams: teamData || [],
        username: profileData?.username || "",
        displayName: profileData?.display_name || "",
        profilePic: profileData?.profile_pic || null
      };

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
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchProfile();
    }
  }, [fetchProfile]);

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
      
      // Update cache
      if (profileCacheRef.current) {
        profileCacheRef.current.profile = { ...profile!, username, display_name: displayName, profile_pic: profilePic };
        profileCacheRef.current.username = username;
        profileCacheRef.current.displayName = displayName;
        profileCacheRef.current.profilePic = profilePic;
      }
      
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

  const refreshTeams = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name")
      .eq("profile_id", user.id);
    setTeams(teamData || []);
    
    // Update cache
    if (profileCacheRef.current) {
      profileCacheRef.current.teams = teamData || [];
    }
  }, []);

  return (
    <main style={{ paddingTop:"56px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "1.5rem", maxWidth: "1600px", margin: "0 auto", width: "100%" }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row g-4">
            {/* LEFT COLUMN - Sidebar */}
            <div className="col-xl-3 col-lg-4">
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
                  onClick={() => { setActiveTab("account"); setIsEditing(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                >
                  <i className="bi bi-wallet2 me-2"></i> Wallet
                </button>
                <button
                  onClick={() => { setActiveTab("myteam"); setIsEditing(false); refreshTeams(); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'myteam' ? 'active' : ''}`}
                >
                  <i className="bi bi-people me-2"></i> My Teams 
                  {teams.length > 0 && <span className="badge bg-white text-primary rounded-pill ms-2">{teams.length}</span>}
                </button>
                <button
                  onClick={() => { setActiveTab("tournaments"); setIsEditing(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
                >
                  <i className="bi bi-trophy me-2"></i> Tournaments Created
                </button>
                <button
                  onClick={() => { setActiveTab("predictions"); setIsEditing(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'predictions' ? 'active' : ''}`}
                >
                  <i className="bi bi-chat-dots me-2"></i> Predictions
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
                <i className="bi bi-box-arrow-right me-2"></i> Sign Out
              </button>
            </div>

            {/* RIGHT COLUMN - Main Content */}
            <div className="col-xl-9 col-lg-8">
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "15px", minHeight: "500px" }}>
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
                  <div className="fade-in">
                    {activeTab === "welcome" && <WelcomeTab profile={profile} />}
                    {activeTab === "account" && <AccountTab />}
                    {activeTab === "myteam" && <MyTeamTab teams={teams} />}
                    {activeTab === "tournaments" && <TournamentsTab />}
                    {activeTab === "predictions" && <PredictionsTab />}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .tab-btn { 
          color: #495057; 
          font-weight: 500; 
          transition: all 0.2s; 
          text-align: left;
        }
        .tab-btn:hover:not(.active) { 
          background-color: #f1f3f5; 
          color: #0d6efd; 
          transform: translateX(5px); 
        }
        .tab-btn.active { 
          background-color: #0d6efd !important; 
          color: white !important; 
        }
        .fade-in { 
          animation: fadeIn 0.3s ease-out; 
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </main>
  );
}