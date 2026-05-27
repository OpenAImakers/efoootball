import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";

interface DisplayProfile {
  id: string;
  username: string;
  display_name: string;
  profile_pic: string | null;
  follower_count?: number;
  is_following?: boolean;
}

export default function Profiles() {
  const [randomProfiles, setRandomProfiles] = useState<DisplayProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSignInToast, setShowSignInToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    checkUser();
    fetchDisplayProfiles();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchDisplayProfiles = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, profile_pic")
        .limit(30);

      if (profilesError) throw profilesError;
      
      if (profiles && profiles.length > 0) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch follower counts and following status for each profile
        const profilesWithStats = await Promise.all(
          profiles.map(async (profile) => {
            // Get follower count
            const { count: followerCount, error: countError } = await supabase
              .from("followers")
              .select("*", { count: 'exact', head: true })
              .eq("following_id", profile.id);
            
            if (countError) console.error("Error fetching follower count:", countError);
            
            let isFollowing = false;
            if (user) {
              // Check if current user is following this profile
              const { data: followData, error: followError } = await supabase
                .from("followers")
                .select("id")
                .eq("follower_id", user.id)
                .eq("following_id", profile.id)
                .maybeSingle();
              
              if (!followError && followData) {
                isFollowing = true;
              }
            }
            
            return {
              ...profile,
              follower_count: followerCount || 0,
              is_following: isFollowing
            };
          })
        );
        
        // Shuffle and select 3-5 random profiles
        const shuffled = [...profilesWithStats].sort(() => 0.5 - Math.random());
        const count = Math.floor(Math.random() * 3) + 3;
        setRandomProfiles(shuffled.slice(0, count));
      }
    } catch (err) {
      console.error("Error gathering exhibition profiles:", err);
    }
  };

  const handleFollow = async (profile: DisplayProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is signed in
    if (!currentUser) {
      setToastMessage("✨ Sign in to follow players and connect with the community! ✨");
      setShowSignInToast(true);
      setTimeout(() => setShowSignInToast(false), 3000);
      return;
    }
    
    // Prevent self-follow
    if (currentUser.id === profile.id) {
      setToastMessage("💫 You can't follow yourself! 💫");
      setShowSignInToast(true);
      setTimeout(() => setShowSignInToast(false), 3000);
      return;
    }
    
    try {
      if (profile.is_following) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id);
        
        if (error) throw error;
        
        // Update local state
        setRandomProfiles(prev => prev.map(p => 
          p.id === profile.id 
            ? { ...p, is_following: false, follower_count: (p.follower_count || 1) - 1 }
            : p
        ));
        
        setToastMessage(`👋 Unfollowed @${profile.username}`);
        setTimeout(() => setShowSignInToast(false), 2000);
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          });
        
        if (error) throw error;
        
        // Update local state
        setRandomProfiles(prev => prev.map(p => 
          p.id === profile.id 
            ? { ...p, is_following: true, follower_count: (p.follower_count || 0) + 1 }
            : p
        ));
        
        setToastMessage(`🎉 You're now following @${profile.username}! 🎉`);
        setTimeout(() => setShowSignInToast(false), 2000);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      setToastMessage("❌ Something went wrong. Please try again.");
      setTimeout(() => setShowSignInToast(false), 3000);
    }
  };

  const handleNavigation = (username: string) => {
    window.location.href = `/profile/${username}`;
  };

  // Football image URLs for fallback
  const footballImages = [
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1522778119026-d73f83e4b9d7?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1459865264687-287d453a3a6c?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=100&h=100&fit=crop",
    "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?w=100&h=100&fit=crop",
    "https://images.pexels.com/photos/47730/the-ball-stadion-football-the-pitch-47730.jpeg?w=100&h=100&fit=crop"
  ];

  const getRandomFootballImage = () => {
    return footballImages[Math.floor(Math.random() * footballImages.length)];
  };

  if (randomProfiles.length === 0) return null;

  return (
    <div className="w-100 py-2 position-relative">
      {/* Toast/Sign In Prompt */}
      {showSignInToast && (
        <div 
          className="position-fixed top-50 start-50 translate-middle shadow-lg rounded-3 px-4 py-3 text-center"
          style={{
            zIndex: 9999,
            background: "linear-gradient(135deg, #ff69b4, #da1b75)",
            color: "white",
            minWidth: "280px",
            maxWidth: "350px",
            animation: "slideInUp 0.3s ease-out"
          }}
        >
          <i className="bi bi-emoji-smile fs-3"></i>
          <p className="mb-0 mt-2 fw-semibold" style={{ fontSize: "14px" }}>
            {toastMessage}
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>

      <div 
        className="d-flex gap-3 pb-2 overflow-auto" 
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {randomProfiles.map((profile) => (
          <div
            key={profile.id}
            className="d-flex flex-column p-3 flex-shrink-0"
            style={{
              width: "260px",
              background: "linear-gradient(145deg, #ffffff, #fff5f8)",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(218, 27, 117, 0.1)",
              color: "#da1b75",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onClick={() => handleNavigation(profile.username)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(218, 27, 117, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(218, 27, 117, 0.1)";
            }}
          >
            {/* Profile Image */}
            <div className="text-center mb-2">
              <img
                src={profile.profile_pic || getRandomFootballImage()}
                alt={profile.display_name}
                className="rounded-circle object-fit-cover"
                style={{
                  width: "80px",
                  height: "80px",
                  border: "3px solid #ff69b4",
                  backgroundColor: "#fff0f5"
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getRandomFootballImage();
                }}
              />
            </div>
            
            {/* Profile Info */}
            <div className="text-center mb-2">
              <h6 className="m-0 fw-bold text-truncate" style={{ fontSize: "15px", color: "#da1b75" }}>
                {profile.display_name}
              </h6>
              <p className="m-0" style={{ fontSize: "11px", color: "#ff69b4" }}>
                @{profile.username}
              </p>
            </div>
            
            {/* Follower Count */}
            <div className="text-center mb-3">
              <div className="d-flex align-items-center justify-content-center gap-1">
                <i className="bi bi-people-fill" style={{ fontSize: "12px", color: "#ff69b4" }}></i>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#da1b75" }}>
                  {profile.follower_count || 0} followers
                </span>
              </div>
            </div>
            
            {/* Follow Button */}
            <button
              className="btn btn-sm fw-bold rounded-pill px-4 py-2 w-100"
              style={{
                fontSize: "12px",
                backgroundColor: profile.is_following ? "#ffffff" : "linear-gradient(135deg, #ff69b4, #da1b75)",
                background: profile.is_following ? "white" : "linear-gradient(135deg, #ff69b4, #da1b75)",
                color: profile.is_following ? "#da1b75" : "white",
                border: profile.is_following ? "2px solid #ff69b4" : "none",
                letterSpacing: "0.5px",
                transition: "all 0.2s"
              }}
              onClick={(e) => handleFollow(profile, e)}
              onMouseEnter={(e) => {
                if (profile.is_following) {
                  e.currentTarget.style.backgroundColor = "#ffe4ec";
                } else {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (profile.is_following) {
                  e.currentTarget.style.backgroundColor = "white";
                } else {
                  e.currentTarget.style.opacity = "1";
                }
              }}
            >
              <i className={`bi ${profile.is_following ? 'bi-check-lg' : 'bi-person-plus'} me-1`}></i>
              {profile.is_following ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}