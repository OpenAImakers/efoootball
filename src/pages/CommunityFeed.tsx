"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

// BRAND COLORS
const BRAND = {
  NAVY: "#1A2251",
  ORANGE: "#F38D1F",
  CYAN: "#00B4D8",
  WHITE: "#FFFFFF",
  LIGHT_BG: "#F8F9FD"
};

const getAvatarColor = (name: string) => {
  const colors = [BRAND.CYAN, BRAND.ORANGE, "#7c3aed", "#db2777", "#16a34a"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const renderAvatar = (profile: any, size: number, hasRing = false) => {
  const name = profile?.display_name || profile?.username || "?";
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <div style={{ padding: hasRing ? '3px' : '0' }}>
      {profile?.profile_pic ? (
        <img
          src={profile.profile_pic}
          alt={name}
          className="rounded-circle shadow-sm"
          style={{ 
            width: `${size}px`, 
            height: `${size}px`, 
            objectFit: "cover",
            border: hasRing ? `2px solid ${BRAND.ORANGE}` : `1px solid #eee`
          }}
        />
      ) : (
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            fontSize: `${size / 2.2}px`,
            backgroundColor: getAvatarColor(name),
            border: hasRing ? `2px solid ${BRAND.ORANGE}` : `1px solid #fff`
          }}
        >
          {firstLetter}
        </div>
      )}
    </div>
  );
};

// Added { user } back to the props to fix the TS2322 Error in Dashboard.tsx
export default function CommunityFeed({ user }: { user: any }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, profile_pic")
        .not("username", "is", null)
        .order("created_at", { ascending: false });
      if (data) setProfiles(data);
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  if (loading) return <div className="p-5 text-center fw-bold" style={{color: BRAND.NAVY}}>LOADING COMMUNITY...</div>;

  return (
    <div className="d-flex flex-column" style={{ backgroundColor: BRAND.LIGHT_BG, minHeight: '60vh' }}>
      
      {/* 1. HORIZONTAL STORIES SCROLLER */}
      <div className="bg-white border-bottom py-3 px-3 overflow-auto d-flex gap-4 no-scrollbar" style={{ flexShrink: 0 }}>
        {profiles.map((p, index) => (
          <Link key={index} to={`/profile/${p.username}`} className="text-center text-decoration-none" style={{ minWidth: "65px" }}>
            <div className="mx-auto mb-1 d-flex justify-content-center">{renderAvatar(p, 58, true)}</div>
            <small className="d-block text-dark fw-bold text-truncate" style={{ fontSize: "0.65rem" }}>
              {p.display_name?.split(' ')[0] || p.username}
            </small>
          </Link>
        ))}
      </div>

      {/* 2. VERTICAL PROFILES GRID */}
      <div className="p-4">
        <h5 className="fw-black mb-4" style={{ color: BRAND.NAVY, letterSpacing: '-0.5px' }}>Member Directory</h5>
        
        <div className="row g-3">
          {profiles.map((p, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <Link to={`/profile/${p.username}`} className="text-decoration-none">
                <div className="card border-0 shadow-sm p-3 profile-card" style={{ borderRadius: '15px', transition: '0.2s', backgroundColor: BRAND.WHITE }}>
                  <div className="d-flex align-items-center gap-3">
                    {renderAvatar(p, 50)}
                    <div className="flex-grow-1 overflow-hidden">
                      <h6 className="mb-0 fw-bold text-dark text-truncate">{p.display_name || p.username}</h6>
                      <small className="text-muted">@{p.username}</small>
                    </div>
                    <div className="text-end">
                       <span className="badge rounded-pill" style={{ backgroundColor: `${BRAND.CYAN}22`, color: BRAND.CYAN, fontSize: '0.6rem' }}>
                         STATS
                       </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .fw-black { font-weight: 900; }
        .profile-card:active { transform: scale(0.98); }
        .profile-card:hover { border-left: 4px solid ${BRAND.ORANGE} !important; }
      `}</style>
    </div>
  );
}