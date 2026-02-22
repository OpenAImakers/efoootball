import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase"; 
import Navbar from "../components/Navbar";

// DASHBOARD THEME
const colors = {
  darkBlue: "#0B0E14",
  cardBg: "#161B22",
  accentOrange: "#FF8C00",
  textGray: "#8B949E",
  border: "#30363D"
};

export default function ProfileView() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cleanUsername = decodeURIComponent(username || "");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, profile_pic")
        .eq("username", cleanUsername)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [cleanUsername]);

  return (
    <main className="min-vh-100 pb-5" style={{ backgroundColor: colors.darkBlue, color: "#e0e0e0" }}>
      <Navbar />
      
      <div className="container mt-5 pt-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: colors.accentOrange }}></div>
            <p className="mt-3 shadow-text" style={{ color: colors.accentOrange, letterSpacing: '2px' }}>SYNCING_DATA...</p>
          </div>
        ) : profile ? (
          <div className="row g-4 px-md-4">
            
            {/* LEFT SIDEBAR: PLAYER ID CARD */}
            <div className="col-lg-4 col-xl-3">
              <div className="card border-0 shadow-lg overflow-hidden" style={{ backgroundColor: colors.cardBg, borderTop: `4px solid ${colors.accentOrange}` }}>
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    {/* Tactical Profile Image / Letter */}
                    {profile.profile_pic ? (
                      <img 
                        src={profile.profile_pic} 
                        alt={profile.username}
                        className="mb-3 shadow"
                        style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "12px", border: `2px solid ${colors.accentOrange}` }}
                      />
                    ) : (
                      <div className="mx-auto mb-3 d-flex align-items-center justify-content-center fw-black shadow" 
                           style={{ 
                             width: "120px", height: "120px", fontSize: "3rem", borderRadius: "12px",
                             background: `linear-gradient(135deg, ${colors.accentOrange} 0%, #ff4500 100%)`,
                             color: "white"
                           }}>
                        {(profile.display_name || profile.username || "U")[0].toUpperCase()}
                      </div>
                    )}

                    <div className="overflow-hidden">
                      <h4 className="mb-0 fw-bold text-white text-truncate">{profile.display_name}</h4>
                      <p className="mb-0 small fw-bold" style={{ color: colors.accentOrange }}>
                        @{profile.username}
                      </p>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary small d-flex justify-content-between align-items-center" style={{ borderColor: `${colors.border} !important` }}>
                      <span className="text-uppercase" style={{ fontSize: '0.65rem', color: colors.textGray, letterSpacing: '1px' }}>System Status</span>
                      <span className="text-success fw-bold small">ONLINE</span>
                    </div>
                    <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary small d-flex justify-content-between align-items-center" style={{ borderColor: `${colors.border} !important` }}>
                      <span className="text-uppercase" style={{ fontSize: '0.65rem', color: colors.textGray, letterSpacing: '1px' }}>Player Rank</span>
                      <span className="text-warning fw-bold small">ELITE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN CONTENT: MISSION LOGS / STATS */}
            <div className="col-lg-8 col-xl-9">
              <div className="p-4 rounded shadow-sm h-100" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <div className="d-flex align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: colors.border }}>
                   <div style={{ width: '3px', height: '20px', backgroundColor: colors.accentOrange, marginRight: '10px' }}></div>
                   <h5 className="text-uppercase fw-bold m-0" style={{ letterSpacing: "2px", color: "white" }}>
                    Performance Metrics
                  </h5>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 rounded text-center" style={{ backgroundColor: colors.darkBlue, border: `1px solid ${colors.border}` }}>
                      <h2 className="fw-bold mb-0" style={{ color: colors.accentOrange }}>--</h2>
                      <small className="text-uppercase text-muted" style={{ fontSize: '0.6rem' }}>Total Broadcasts</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded text-center" style={{ backgroundColor: colors.darkBlue, border: `1px solid ${colors.border}` }}>
                      <h2 className="fw-bold mb-0" style={{ color: colors.accentOrange }}>--</h2>
                      <small className="text-uppercase text-muted" style={{ fontSize: '0.6rem' }}>Reputation</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded text-center" style={{ backgroundColor: colors.darkBlue, border: `1px solid ${colors.border}` }}>
                      <h2 className="fw-bold mb-0" style={{ color: colors.accentOrange }}>--</h2>
                      <small className="text-uppercase text-muted" style={{ fontSize: '0.6rem' }}>Member Since</small>
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-center py-5 border rounded" style={{ borderStyle: 'dashed !important', borderColor: colors.border, color: colors.textGray }}>
                   <p className="mb-0 small text-uppercase" style={{ letterSpacing: '3px' }}>Loading tactical history...</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="container py-5 text-center">
            <div className="alert d-inline-block px-5 border-0 shadow" style={{ backgroundColor: "#2d1b1b", color: "#ff8484" }}>
              <h4 className="fw-bold mb-0">ERR: USER_NOT_FOUND</h4>
              <p className="small mb-0 mt-2">Target identity "@{cleanUsername}" does not exist in the database.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}