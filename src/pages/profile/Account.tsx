// app/profile/ProfilePage.tsx
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../supabase";
import Navbar from "../../components/Navbar";
import WelcomeTab from "./components/WelcomeTab";
import AccountTab from "./components/AccountTab";
import MyTeamTab from "./components/MyTeamTab";
import TournamentsTab from "./components/TournamentsTab";
import PredictionsTab from "./components/PredictionsTab";
import ProfileEditForm from "./components/ProfileEditForm";

// Skeleton Loader Component
function ProfileSkeleton() {
  return (
    <div className="row g-4">
      {/* Left Column Skeleton */}
      <div className="col-xl-3 col-lg-4">
        <div className="card border-0 shadow-sm p-4 text-center mb-4" style={{ borderRadius: "15px" }}>
          <div className="mb-3">
            <div className="rounded-circle bg-secondary mx-auto" style={{ width: "100px", height: "100px", opacity: 0.3 }}></div>
          </div>
          <div className="skeleton-text mx-auto" style={{ width: "60%", height: "20px", marginBottom: "8px" }}></div>
          <div className="skeleton-text mx-auto" style={{ width: "40%", height: "14px" }}></div>
          <div className="mt-3 skeleton-text" style={{ width: "100%", height: "38px", borderRadius: "8px" }}></div>
        </div>
        
        <div className="list-group shadow-sm border-0 mb-4" style={{ borderRadius: "15px", overflow: "hidden" }}>
          <div className="list-group-item bg-primary text-white border-0 py-3" style={{ opacity: 0.8 }}>
            <div className="skeleton-text" style={{ width: "50%", height: "20px", backgroundColor: "rgba(255,255,255,0.5)" }}></div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="list-group-item border-0 py-3" style={{ borderBottom: "1px solid #e9ecef" }}>
              <div className="skeleton-text" style={{ width: "60%", height: "18px" }}></div>
            </div>
          ))}
        </div>
        
        <div className="skeleton-text" style={{ width: "100%", height: "48px", borderRadius: "15px" }}></div>
      </div>
      
      {/* Right Column Skeleton */}
      <div className="col-xl-9 col-lg-8">
        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "15px", minHeight: "500px" }}>
          <div className="skeleton-text" style={{ width: "30%", height: "28px", marginBottom: "24px" }}></div>
          <div className="skeleton-text" style={{ width: "100%", height: "60px", marginBottom: "16px", borderRadius: "8px" }}></div>
          <div className="skeleton-text" style={{ width: "100%", height: "50px", marginBottom: "12px", borderRadius: "8px" }}></div>
          <div className="skeleton-text" style={{ width: "100%", height: "50px", marginBottom: "12px", borderRadius: "8px" }}></div>
          <div className="skeleton-text" style={{ width: "100%", height: "80px", marginBottom: "12px", borderRadius: "8px" }}></div>
          <div className="skeleton-text" style={{ width: "100%", height: "100px", borderRadius: "8px" }}></div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-text {
          background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
    gender: string | null;
    county: string | null;
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
  const [gender, setGender] = useState("");
  const [county, setCounty] = useState("");
  const [waveAnimation, setWaveAnimation] = useState(false);
  const [isGenderLocked, setIsGenderLocked] = useState(false);
  const [isCountyLocked, setIsCountyLocked] = useState(false);
  
  // Cache ref to prevent multiple fetches
  const fetchedRef = useRef(false);
  const profileCacheRef = useRef<any>(null);

  // Check for missing profile details
  const missingDetails = [];
  if (!profile?.gender) missingDetails.push("gender");
  if (!profile?.county) missingDetails.push("county");
  const hasMissingDetails = missingDetails.length > 0;

  // Trigger wave animation on mount if details missing
  useEffect(() => {
    if (hasMissingDetails && !isEditing) {
      setWaveAnimation(true);
      const timer = setTimeout(() => setWaveAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasMissingDetails, isEditing]);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && profileCacheRef.current) {
      const cached = profileCacheRef.current;
      setProfile(cached.profile);
      setTeams(cached.teams);
      setUsername(cached.username);
      setDisplayName(cached.displayName);
      setProfilePic(cached.profilePic);
      setGender(cached.gender || "");
      setCounty(cached.county || "");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      // Fetch profile and teams in parallel for better performance
      const [profileResult, teamResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, display_name, profile_pic, gender, county")
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
        profilePic: profileData?.profile_pic || null,
        gender: profileData?.gender || "",
        county: profileData?.county || ""
      };

      setProfile(profileData);
      setUsername(profileData?.username || "");
      setDisplayName(profileData?.display_name || "");
      setProfilePic(profileData?.profile_pic || null);
      setGender(profileData?.gender || "");
      setCounty(profileData?.county || "");
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

  useEffect(() => {
    if (profile) {
      setIsGenderLocked(!!profile.gender);
      setIsCountyLocked(!!profile.county);
    }
  }, [profile]);
  
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
          profile_pic: profilePic,
          gender: gender || null,
          county: county || null
        })
        .eq("id", user.id);
      if (error) throw error;
      
      // Update cache
      if (profileCacheRef.current) {
        profileCacheRef.current.profile = { 
          ...profile!, 
          username, 
          display_name: displayName, 
          profile_pic: profilePic,
          gender,
          county
        };
        profileCacheRef.current.username = username;
        profileCacheRef.current.displayName = displayName;
        profileCacheRef.current.profilePic = profilePic;
        profileCacheRef.current.gender = gender;
        profileCacheRef.current.county = county;
      }
      
      setProfile({ 
        ...profile!, 
        username, 
        display_name: displayName, 
        profile_pic: profilePic,
        gender,
        county
      });
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
          <ProfileSkeleton />
        ) : error ? (
          <div className="alert alert-danger d-flex align-items-center justify-content-between">
            <div>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={() => fetchProfile(true)}
            >
              <i className="bi bi-arrow-repeat me-1"></i>
              Retry
            </button>
          </div>
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
                
                {/* Missing Details Warning with Wave Animation */}
                {hasMissingDetails && !isEditing && (
                  <div className={`alert alert-warning py-2 px-3 mb-3 d-flex align-items-center justify-content-center gap-2 ${waveAnimation ? 'wave-animation' : ''}`} 
                       style={{ fontSize: "0.8rem", borderRadius: "50px" }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Missing: {missingDetails.join(", ")}</span>
                    <i className="bi bi-pencil-square"></i>
                  </div>
                )}
                
                <button
                  className={`btn btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'} w-100 fw-bold ${hasMissingDetails && !isEditing ? 'pulse-btn' : ''}`}
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setActiveTab("welcome");
                    setWaveAnimation(false);
                  }}
                >
                  {isEditing ? "Exit Editor" : "Edit Profile"}
                  {hasMissingDetails && !isEditing && (
                    <span className="badge bg-warning text-dark ms-2">!</span>
                  )}
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
                  <ProfileEditForm
                    displayName={displayName}
                    username={username}
                    profilePic={profilePic}
                    gender={gender}
                    county={county}
                    saving={saving}
                    isGenderLocked={isGenderLocked}
                    isCountyLocked={isCountyLocked}
                    onDisplayNameChange={setDisplayName}
                    onUsernameChange={setUsername}
                    onGenderChange={setGender}
                    onCountyChange={setCounty}
                    onFileChange={handleFileChange}
                    onSave={handleSaveProfile}
                  />
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
        
        /* Wave Animation */
        @keyframes wave {
          0% { transform: translateX(0px); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0px); }
        }
        
        .wave-animation {
          animation: wave 0.5s ease-in-out 3;
          background-color: #fff3cd !important;
          border-color: #ffecb5 !important;
        }
        
        /* Pulse animation for edit button */
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
        }
        
        .pulse-btn {
          animation: pulse 1.5s ease-in-out 2;
        }
      `}</style>
    </main>
  );
}