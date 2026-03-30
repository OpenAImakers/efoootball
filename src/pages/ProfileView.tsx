import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase"; 
import Navbar from "../components/Navbar";

const colors = {
  darkBlue: "#0B0E14",
  cardBg: "#161B22",
  accentOrange: "#FF8C00",
  textGray: "#8B949E",
  border: "#30363D",
  success: "#28a745"
};

export default function ProfileView() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const cleanUsername = decodeURIComponent(username || "");

  // Defined with useCallback to satisfy ESLint and prevent unnecessary re-renders
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, display_name, username, profile_pic")
      .eq("username", cleanUsername)
      .single();
    
    if (prof) {
      setProfile(prof);
      const [fwer, fwing, check] = await Promise.all([
        supabase.from("followers").select("*", { count: 'exact', head: true }).eq("following_id", prof.id),
        supabase.from("followers").select("*", { count: 'exact', head: true }).eq("follower_id", prof.id),
        user ? supabase.from("followers").select("id").eq("follower_id", user.id).eq("following_id", prof.id).single() : { data: null }
      ]);

      setCounts({ followers: fwer.count || 0, following: fwing.count || 0 });
      setIsFollowing(!!check.data);
    }
    setLoading(false);
  }, [cleanUsername]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!currentUser) return alert("Sign in to follow!");
    if (currentUser.id === profile.id) return;

    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", currentUser.id).eq("following_id", profile.id);
      setCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
      setIsFollowing(false);
    } else {
      await supabase.from("followers").insert({ follower_id: currentUser.id, following_id: profile.id });
      setCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
      setIsFollowing(true);
    }
  };

  return (
    <main className="min-vh-100 pb-5" style={{ backgroundColor: colors.darkBlue, color: "#e0e0e0" }}>
      <Navbar />
      
      <div className="container mt-5 pt-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: colors.accentOrange }}></div>
          </div>
        ) : profile ? (
          <div className="row g-4">
            
            {/* LEFT COLUMN: Identity & Actions */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-lg" style={{ backgroundColor: colors.cardBg, borderRadius: '24px', border: `1px solid ${colors.border}` }}>
                <div className="card-body p-4 text-center">
                  <div className="position-relative d-inline-block mb-3">
                    {profile.profile_pic ? (
                      <img src={profile.profile_pic} alt={profile.username} className="shadow-lg"
                        style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "30px", border: `4px solid ${colors.accentOrange}` }} />
                    ) : (
                      <div className="mx-auto d-flex align-items-center justify-content-center fw-black shadow-lg" 
                           style={{ width: "140px", height: "140px", fontSize: "3.5rem", borderRadius: "30px", background: `linear-gradient(135deg, ${colors.accentOrange} 0%, #ff4500 100%)`, color: "white" }}>
                        {profile.display_name?.[0].toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="fw-black text-white mb-1">{profile.display_name}</h3>
                  <p className="fw-bold mb-4" style={{ color: colors.accentOrange, letterSpacing: '1px' }}>@{profile.username}</p>

                  <div className="row g-0 mb-4 py-3 rounded-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.border}` }}>
                    <div className="col-6 border-end" style={{ borderColor: colors.border }}>
                      <h4 className="mb-0 fw-black text-white">{counts.followers}</h4>
                      <small className="text-muted fw-bold" style={{ fontSize: '0.65rem' }}>FOLLOWERS</small>
                    </div>
                    <div className="col-6">
                      <h4 className="mb-0 fw-black text-white">{counts.following}</h4>
                      <small className="text-muted fw-bold" style={{ fontSize: '0.65rem' }}>FOLLOWING</small>
                    </div>
                  </div>

                  {currentUser?.id !== profile.id && (
                    <button onClick={handleFollowToggle} className="btn w-100 fw-black rounded-pill py-3 shadow-sm transition-all"
                            style={{ backgroundColor: isFollowing ? "#30363D" : colors.accentOrange, color: "white", fontSize: '0.9rem' }}>
                      {isFollowing ? "UNFOLLOW MEMBER" : "FOLLOW MEMBER"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Vitals redistributed to fill space */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-lg h-100" style={{ backgroundColor: colors.cardBg, borderRadius: '24px', border: `1px solid ${colors.border}` }}>
                <div className="card-body p-4">
                  <h5 className="fw-black text-white mb-4 d-flex align-items-center">
                    <span className="me-2" style={{ width: '4px', height: '18px', backgroundColor: colors.accentOrange, display: 'inline-block', borderRadius: '2px' }}></span>
                    MEMBER DETAILS
                  </h5>

                  <div className="row g-3">
                    {[
                      { label: "Predictor Role", val: "Pro Predictor" },
                      { label: "Associated Team", val: "Wasafi FC" },
                      { label: "Origin Country", val: "Kenya" },
                      { label: "Primary Language", val: "Kiswahili" },
                      { label: "Leaderboard Rank", val: "#00" },
                      { label: "Tournament Wins", val: "0" }
                    ].map((item, i) => (
                      <div key={i} className="col-md-6">
                        <div className="px-4 py-3 rounded-4 d-flex justify-content-between align-items-center h-100" 
                             style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${colors.border}` }}>
                          <span className="text-muted fw-bold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{item.label}</span>
                          <span className="text-white fw-black" style={{ fontSize: '0.85rem' }}>{item.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Optional info block to finish the layout */}
                  <div className="mt-4 p-4 rounded-4" style={{ background: `linear-gradient(to right, rgba(255,140,0,0.05), transparent)`, border: `1px dashed ${colors.border}` }}>
                    <small className="text-muted d-block">
                      Member profile is verified for tournament participation. Follow to get updates on their future predictions.
                    </small>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="container py-5 text-center">
            <div className="alert d-inline-block px-5 border-0 shadow-lg" style={{ backgroundColor: "#2d1b1b", color: "#ff8484", borderRadius: '12px' }}>
              <h4 className="fw-black mb-0">USER NOT FOUND</h4>
            </div>
          </div>
        )}
      </div>
      <style>{`.fw-black { font-weight: 900 !important; } .transition-all { transition: all 0.2s ease-in-out; }`}</style>
    </main>
  );
}