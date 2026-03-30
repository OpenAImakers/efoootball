"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

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

export default function CommunityFeed({ user }: { user: any }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [myFollowing, setMyFollowing] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("profiles")
      .select(`
        id, username, display_name, profile_pic,
        followers!following_id (count)
      `)
      .not("username", "is", null)
      .order("created_at", { ascending: false });

    if (profs) setProfiles(profs);

    if (user) {
      const { data: follows } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);
      if (follows) setMyFollowing(follows.map(f => f.following_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollow = async (e: React.MouseEvent, targetId: string) => {
    e.preventDefault(); 
    if (!user) return alert("Please sign in to follow members!");

    const isFollowing = myFollowing.includes(targetId);

    if (isFollowing) {
      const { error } = await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetId);
      if (!error) setMyFollowing(prev => prev.filter(id => id !== targetId));
    } else {
      const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: targetId });
      if (!error) setMyFollowing(prev => [...prev, targetId]);
    }
    fetchData();
  };

  const filteredProfiles = profiles.filter(p => 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-5 text-center fw-bold" style={{color: BRAND.NAVY}}>REFRESHING COMMUNITY...</div>;

  return (
    <div className="d-flex flex-column w-100" style={{ backgroundColor: BRAND.LIGHT_BG, minHeight: '60vh' }}>
      
      {/* 1. SEARCH BAR AREA */}
      <div className="bg-white p-3 border-bottom w-100 sticky-top" style={{ top: "125px", zIndex: 10 }}>
         <input 
            type="text" 
            className="form-control rounded-pill border-0 shadow-sm px-4" 
            placeholder="Search members..." 
            style={{ backgroundColor: "#f1f3f9", fontSize: '0.9rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {/* 2. STORIES SCROLLER */}
      <div className="bg-white border-bottom py-3 px-3 overflow-auto d-flex gap-4 no-scrollbar w-100" style={{ flexShrink: 0 }}>
        {profiles.slice(0, 10).map((p, index) => (
          <Link key={index} to={`/profile/${p.username}`} className="text-center text-decoration-none" style={{ minWidth: "65px" }}>
            <div className="mx-auto mb-1 d-flex justify-content-center">{renderAvatar(p, 58, true)}</div>
            <small className="d-block text-dark fw-bold text-truncate" style={{ fontSize: "0.65rem" }}>
              {p.display_name?.split(' ')[0] || p.username}
            </small>
          </Link>
        ))}
      </div>

      {/* 3. PROFILE GRID */}
      <div className="p-3 w-100">
        <div className="row g-3 w-100 m-0">
          {filteredProfiles.map((p, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4 px-1">
                <div className="card border-0 shadow-sm p-3 profile-card w-100" style={{ borderRadius: '15px', backgroundColor: BRAND.WHITE }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <Link to={`/profile/${p.username}`} className="d-flex align-items-center gap-3 text-decoration-none flex-grow-1 overflow-hidden">
                      {renderAvatar(p, 50)}
                      <div className="overflow-hidden">
                        <h6 className="mb-0 fw-bold text-dark text-truncate">{p.display_name || p.username}</h6>
                        <div className="d-flex align-items-center gap-2">
                           <small className="text-muted" style={{ fontSize: '0.7rem' }}>@{p.username}</small>
                           <div className="px-2 py-0 rounded-pill bg-light border" style={{ fontSize: '0.65rem' }}>
                              <span className="text-muted fw-bold">RANK </span>
                              <span className="fw-black text-dark">00</span>
                           </div>
                        </div>
                      </div>
                    </Link>

                    <div className="d-flex flex-column align-items-end gap-1">
                      {user?.id !== p.id && (
                         <button 
                           onClick={(e) => handleFollow(e, p.id)}
                           className="btn btn-sm fw-black rounded-pill px-3"
                           style={{ 
                              fontSize: '0.65rem', 
                              backgroundColor: myFollowing.includes(p.id) ? "#eee" : BRAND.NAVY,
                              color: myFollowing.includes(p.id) ? "#666" : BRAND.WHITE 
                           }}
                         >
                           {myFollowing.includes(p.id) ? "FOLLOWING" : "FOLLOW"}
                         </button>
                      )}
                      <small className="fw-black text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
                         {p.followers?.[0]?.count || 0} FOLLOWERS
                      </small>
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .fw-black { font-weight: 900 !important; }
        .profile-card:hover { transform: translateY(-3px); transition: 0.2s; box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
        .w-100 { width: 100% !important; }
      `}</style>
    </div>
  );
}