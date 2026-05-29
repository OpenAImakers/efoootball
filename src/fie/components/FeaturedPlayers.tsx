import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";

interface PlayerProfileSchema {
  id: number | string;
  name: string;
  age?: number | string;
  place?: string;
  player_avatar?: string;
  gender?: string;
  clan?: string;
}

const shuffleArray = (array: number[]): number[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function FeaturedPlayers() {
  const [players, setPlayers] = useState<PlayerProfileSchema[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [shuffledQueue, setShuffledQueue] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggerAnim, setTriggerAnim] = useState<boolean>(true);

  useEffect(() => {
    fetchLiveProfiles();
  }, []);

  useEffect(() => {
    if (!players.length) return;
    const baseIndices = players.map((_, idx) => idx);
    const shuffled = shuffleArray(baseIndices);
    setShuffledQueue(shuffled);
    setCurrentIndex(shuffled[0]);
  }, [players]);

  useEffect(() => {
    if (!players.length || shuffledQueue.length <= 1 || currentIndex === null) return;

    const interval = setInterval(() => {
      setTriggerAnim(false);

      setTimeout(() => {
        const currentQueuePos = shuffledQueue.indexOf(currentIndex);
        const nextQueuePos = currentQueuePos + 1;

        if (nextQueuePos < shuffledQueue.length) {
          setCurrentIndex(shuffledQueue[nextQueuePos]);
        } else {
          const baseIndices = players.map((_, idx) => idx);
          let freshShuffle = shuffleArray(baseIndices);

          if (players.length > 1 && freshShuffle[0] === currentIndex) {
            [freshShuffle[0], freshShuffle[freshShuffle.length - 1]] = [
              freshShuffle[freshShuffle.length - 1],
              freshShuffle[0],
            ];
          }

          setShuffledQueue(freshShuffle);
          setCurrentIndex(freshShuffle[0]);
        }
        setTriggerAnim(true);
      }, 400); 
    }, 8000); 

    return () => clearInterval(interval);
  }, [players, shuffledQueue, currentIndex]);

  const fetchLiveProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clan_players_profiles")
        .select("*");

      if (error) throw error;
      if (data) setPlayers(data);
    } catch (err) {
      console.error("Error connecting to live player tables:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex flex-column text-white position-relative overflow-hidden shadow-lg w-100 mb-2 mt-3"
      style={{
        background: "#071426", // Synced background color
        borderRadius: "12px",
        padding: "24px 20px 28px 20px",
        minHeight: "260px",
        border: "1px solid rgba(77, 163, 255, 0.25)", // Synced border styling
        fontFamily: "'Times New Roman', Times, serif" // Synced newspaper layout text engine
      }}
    >
      {/* Newspaper Colorway Shimmer Engine */}
      <style>{`
        @keyframes newspaperShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes blue-pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 10px #4da3ff; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .skeleton-newspaper {
          background: linear-gradient(90deg, #102238 25%, #1a3554 50%, #102238 75%);
          background-size: 200% 100%;
          animation: newspaperShimmer 1.6s infinite linear;
        }
        .live-blue-dot {
          width: 8px;
          height: 8px;
          background-color: #4da3ff;
          border-radius: 50%;
          display: inline-block;
          animation: blue-pulse 2s infinite ease-in-out;
        }
        .slide-left-item {
          transform: translateX(${triggerAnim ? "0" : "-40px"});
          opacity: ${triggerAnim ? "1" : "0"};
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slide-right-item {
          transform: translateX(${triggerAnim ? "0" : "40px"});
          opacity: ${triggerAnim ? "1" : "0"};
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-center-card {
          transform: scale(${triggerAnim ? "1" : "0.95"});
          opacity: ${triggerAnim ? "1" : "0"};
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* SYNCHRONIZED HEADER STRIP */}
      <div 
        className="d-flex align-items-center justify-content-between pb-2 mb-3" 
        style={{ borderBottom: "1px solid rgba(77, 163, 255, 0.15)" }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="live-blue-dot"></span>
          <span 
            className="text-uppercase fw-bold" 
            style={{ 
              fontSize: "11px", 
              letterSpacing: "1.5px", 
              color: "#9bb9d4",
              fontFamily: "system-ui, sans-serif" 
            }}
          >
          Featured player 
          </span>
        </div>
      </div>

      {/* CONTENT SYSTEM ROUTER */}
      {loading || !players.length || currentIndex === null ? (
        /* COLOR MATCHED SKELETON SCREEN */
        <div className="d-flex align-items-center justify-content-between w-100 my-auto px-3">
          <div className="skeleton-newspaper rounded" style={{ width: "50px", height: "35px" }}></div>
          <div className="text-center d-flex flex-column align-items-center" style={{ width: "40%" }}>
            <div className="skeleton-newspaper rounded-circle" style={{ width: "96px", height: "96px" }}></div>
            <div className="skeleton-newspaper rounded mt-3" style={{ width: "75%", height: "18px" }}></div>
          </div>
          <div className="skeleton-newspaper rounded" style={{ width: "65px", height: "35px" }}></div>
        </div>
      ) : (
        /* LIVE CONTENT DISPATCH */
        (() => {
          const player = players[currentIndex];
          return (
            <div className="d-flex align-items-center justify-content-between w-100 my-auto px-2">
              
              {/* LEFT: AGE */}
              <div className="slide-left-item text-start">
                <div 
                  className="text-uppercase fw-semibold m-0" 
                  style={{ fontSize: "11px", color: "#9bb9d4", fontFamily: "system-ui, sans-serif" }}
                >
                  Age
                </div>
                <div className="fw-bold h2 m-0" style={{ color: "#ffffff" }}>
                  {player.age || "—"}
                </div>
              </div>

              {/* CENTER: IMAGE FADE & NAME */}
              <div className="fade-center-card text-center d-flex flex-column align-items-center" style={{ width: "50%" }}>
                <div 
                  className="position-relative p-1 rounded-circle mb-2" 
                  style={{ 
                    background: "rgba(77, 163, 255, 0.25)",
                    border: "1px solid rgba(77, 163, 255, 0.4)",
                    width: "100px",
                    height: "100px"
                  }}
                >
                  <img
                    src={player.player_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    alt={player.name}
                    className="rounded-circle w-100 h-100"
                    style={{ objectFit: "cover", background: "#102238" }}
                  />
                </div>
                <h3 className="fw-bold m-0 text-truncate w-100" style={{ fontSize: "1.25rem", color: "#ffffff" }}>
                  {player.name}
                </h3>
                {player.clan && (
                  <span 
                    className="badge mt-1 px-2 py-1 rounded-sm text-uppercase" 
                    style={{ 
                      background: "rgba(77, 163, 255, 0.15)", 
                      color: "#4da3ff",
                      fontSize: "9px",
                      border: "1px solid rgba(77, 163, 255, 0.2)",
                      fontFamily: "system-ui, sans-serif"
                    }}
                  >
                    clan : {player.clan}
                  </span>
                )}
              </div>

              {/* RIGHT: ORIGIN COUNTRY */}
              <div className="slide-right-item text-end" style={{ maxWidth: "30%" }}>
                <div 
                  className="text-uppercase fw-semibold m-0" 
                  style={{ fontSize: "11px", color: "#9bb9d4", fontFamily: "system-ui, sans-serif" }}
                >
                  Origin
                </div>
                <div className="fw-bold fs-5 text-truncate text-uppercase" style={{ color: "#4da3ff" }}>
                  {player.place || "INTL"}
                </div>
              </div>

            </div>
          );
        })()
      )}
    </div>
  );
}