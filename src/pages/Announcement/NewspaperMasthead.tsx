import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";

export default function NewspaperMasthead() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
    };

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, profile_pic, username")
          .eq("id", userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // No more warning!

  const handleProfileClick = () => {
    if (user) {
      window.location.href = `/profile/${profile?.username || user.id}`;
    } else {
      window.location.href = "/auth";
    }
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div 
      style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 1000,
        background: "rgba(7, 20, 38, 0.95)", 
        backdropFilter: "blur(8px)",
        borderBottom: "4px double rgba(77, 163, 255, 0.4)", 
      }}
    >
      <div className="container py-3">
        <div className="d-flex align-items-center justify-content-between">
          {/* Logo on the left */}
          <div style={{ width: "80px" }}>
            <img 
              src="/kefr.png" 
              alt="KEFR Logo" 
              style={{ 
                height: "60px", 
                width: "auto", 
                borderRadius: "10px",
                objectFit: "contain",
                filter: "brightness(1.1)"
              }}
            />
          </div>
          
          {/* Title centered */}
          <h1 className="fw-bold text-uppercase m-0 tracking-wide" style={{ color: "#ffffff", fontSize: "1.75rem", letterSpacing: "1px" }}>
            Kenya eFootball Rankings
          </h1>
          
          {/* Profile Icon on the right */}
          <div style={{ width: "80px", display: "flex", justifyContent: "flex-end" }}>
            <div
              onClick={handleProfileClick}
              style={{
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                borderRadius: "50%",
                background: user ? "linear-gradient(135deg, #ffb6c1, #ff69b4)" : "rgba(255, 255, 255, 0.1)",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(77, 163, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {user && profile?.profile_pic ? (
                <img
                  src={profile.profile_pic}
                  alt={profile.display_name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid white",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              ) : user ? (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ffb6c1, #ff69b4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  {getInitials(profile?.display_name || user.email?.[0] || "U")}
                </div>
              ) : (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(77, 163, 255, 0.4)",
                    color: "#9bb9d4",
                  }}
                >
                  <i className="bi bi-person" style={{ fontSize: "24px" }}></i>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div 
          className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top"
          style={{ borderColor: "rgba(77, 163, 255, 0.15)", fontFamily: "system-ui, sans-serif", fontSize: "11px" }}
        >
          <span style={{ color: "#9bb9d4" }}>
            {new Date().toLocaleDateString("en-KE", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          
          {/* Optional: Show username when logged in */}
          {user && profile && (
            <span style={{ color: "#ffb6c1", fontSize: "11px" }}>
              Welcome, {profile.display_name || profile.username}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
