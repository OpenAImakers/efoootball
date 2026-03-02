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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [activeTab, setActiveTab] = useState("welcome");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
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
          .select("username, display_name, profile_pic")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(data);
        setUsername(data?.username || "");
        setDisplayName(data?.display_name || "");
        setProfilePic(data?.profile_pic || null);
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
      setProfile({ ...profile, username, display_name: displayName, profile_pic: profilePic });
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
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
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
            
{/* LEFT COLUMN: IDENTITY & TABS */}
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

  {/* ACTIVITY TABS */}
  <div className="list-group shadow-sm border-0 mb-4" style={{ borderRadius: "15px", overflow: "hidden" }}>
    <div className="list-group-item bg-primary text-white border-0 fw-bold py-3">
      Player Activity
    </div>
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
    <button 
      onClick={() => { setActiveTab("picks"); setIsEditing(false); }}
      className={`list-group-item list-group-item-action border-0 py-3 tab-btn ${activeTab === 'picks' ? 'active' : ''}`}
    >
      Picks
    </button>
  </div>

  {/* SIGN OUT BUTTON - Cleanly placed at bottom of sidebar */}
  <button
    className="btn btn-outline-danger w-100 fw-bold py-2 shadow-sm"
    style={{ borderRadius: "15px", borderWidth: "2px" }}
    onClick={async () => {
      await supabase.auth.signOut();
      window.location.href = "/"; // Standard redirect
    }}
  >
    <i className="bi bi-box-arrow-right me-2"></i> Sign Out
  </button>
</div>

            {/* RIGHT COLUMN: CONTENT AREA */}
            <div className="col-md-8">
              <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "15px", minHeight: "400px" }}>
                
                {isEditing ? (
                  <div>
                    <h5 className="fw-bold text-primary mb-4">Edit Profile</h5>
                    
                    <div className="mb-4 text-center p-3 bg-light rounded border">
                      <p className="small fw-bold text-uppercase text-muted mb-2">Update Avatar</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="form-control form-control-sm" 
                        onChange={handleFileChange}
                      />
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
                    <div className="fade-in">
                        {activeTab === "welcome" && (
                        <>
                            <h4 className="fw-bold text-primary">Welcome, {profile?.display_name || profile?.username}!</h4>
                            <p className="text-muted">Explore your stats using the tabs on the left.</p>
                        </>
                        )}
                        {activeTab === "tournaments" && <h5 className="text-muted border-bottom pb-2">Tournaments will appear here</h5>}
                        {activeTab === "predictions" && <h5 className="text-muted border-bottom pb-2">Predictions will appear here</h5>}
                        {activeTab === "picks" && <h5 className="text-muted border-bottom pb-2">Picks will appear here</h5>}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`
        /* Fixes the text visibility on highlight */
        .tab-btn {
          color: #495057; /* Standard dark gray for text */
          font-weight: 500;
        }

        .tab-btn:hover:not(.active) {
          background-color: #e9ecef;
          color: #0d6efd;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
        }
      `}</style>
    </main>
  );
}