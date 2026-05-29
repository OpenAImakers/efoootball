import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface MatchSchema {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_goals: number;
  away_goals: number;
  home_ht_goals?: number;
  away_ht_goals?: number;
  played: boolean;
}

interface TeamSchema {
  id: number;
  name: string;
}

interface EPLTeamAsset {
  name: string;
  logo: string;
}

const eplTeams: EPLTeamAsset[] = [
  { name: "Arsenal", logo: "https://resources.premierleague.com/premierleague/badges/50/t3.png" },
  { name: "Aston Villa", logo: "https://resources.premierleague.com/premierleague/badges/50/t7.png" },
  { name: "Bournemouth", logo: "https://resources.premierleague.com/premierleague/badges/50/t91.png" },
  { name: "Brentford", logo: "https://resources.premierleague.com/premierleague/badges/50/t94.png" },
  { name: "Brighton", logo: "https://resources.premierleague.com/premierleague/badges/50/t36.png" },
  { name: "Chelsea", logo: "https://resources.premierleague.com/premierleague/badges/50/t8.png" },
  { name: "Crystal Palace", logo: "https://resources.premierleague.com/premierleague/badges/50/t31.png" },
  { name: "Everton", logo: "https://resources.premierleague.com/premierleague/badges/50/t11.png" },
  { name: "Fulham", logo: "https://resources.premierleague.com/premierleague/badges/50/t54.png" },
  { name: "Ipswich Town", logo: "https://resources.premierleague.com/premierleague/badges/50/t40.png" },
  { name: "Leicester City", logo: "https://resources.premierleague.com/premierleague/badges/50/t13.png" },
  { name: "Liverpool", logo: "https://resources.premierleague.com/premierleague/badges/50/t14.png" },
  { name: "Manchester City", logo: "https://resources.premierleague.com/premierleague/badges/50/t43.png" },
  { name: "Manchester United", logo: "https://resources.premierleague.com/premierleague/badges/50/t1.png" },
  { name: "Newcastle United", logo: "https://resources.premierleague.com/premierleague/badges/50/t4.png" },
  { name: "Nottingham Forest", logo: "https://resources.premierleague.com/premierleague/badges/50/t17.png" },
  { name: "Southampton", logo: "https://resources.premierleague.com/premierleague/badges/50/t20.png" },
  { name: "Tottenham Hotspur", logo: "https://resources.premierleague.com/premierleague/badges/50/t6.png" },
  { name: "West Ham United", logo: "https://resources.premierleague.com/premierleague/badges/50/t21.png" },
  { name: "Wolverhampton Wanderers", logo: "https://resources.premierleague.com/premierleague/badges/50/t39.png" }
];

const shuffleArray = (array: number[]): number[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function MatchPreviews() {
  const [matches, setMatches] = useState<MatchSchema[]>([]);
  const [teams, setTeams] = useState<TeamSchema[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [shuffledQueue, setShuffledQueue] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!matches.length) return;
    
    const initialIndices = matches.map((_, index) => index);
    const shuffled = shuffleArray(initialIndices);
    
    setShuffledQueue(shuffled);
    setCurrentIndex(shuffled[0]);
  }, [matches]);

  useEffect(() => {
    if (!matches.length || shuffledQueue.length <= 1 || currentIndex === null) return;

    const interval = setInterval(() => {
      const currentQueuePosition = shuffledQueue.indexOf(currentIndex);
      const nextQueuePosition = currentQueuePosition + 1;

      if (nextQueuePosition < shuffledQueue.length) {
        setCurrentIndex(shuffledQueue[nextQueuePosition]);
      } else {
        const baseIndices = matches.map((_, index) => index);
        let freshShuffle = shuffleArray(baseIndices);

        if (matches.length > 1 && freshShuffle[0] === currentIndex) {
          [freshShuffle[0], freshShuffle[freshShuffle.length - 1]] = [freshShuffle[freshShuffle.length - 1], freshShuffle[0]];
        }

        setShuffledQueue(freshShuffle);
        setCurrentIndex(freshShuffle[0]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [matches, shuffledQueue, currentIndex]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: teamData } = await supabase
        .from("teams")
        .select("id, name");

      if (matchData) setMatches(matchData);
      if (teamData) setTeams(teamData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeam = (id: number) => {
    const team = teams.find((t) => t.id === id);
    const logo = eplTeams[id % eplTeams.length].logo;

    return {
      name: team?.name || "Unknown",
      logo
    };
  };

  return (
    <div
      className="d-flex flex-column text-white position-relative overflow-hidden shadow-lg"
      style={{
        background: "#0b0014",
        borderRadius: "18px",
        padding: "30px 24px 40px 24px",
        minHeight: "330px",
        border: "1px solid #1f0833"
      }}
    >
      {/* Dynamic Keyframes for Shimmer & Live Pulse Effects */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #160a22 25%, #251438 50%, #160a22 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite linear;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background-color: #00ff87;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 2s infinite ease-in-out;
          box-shadow: 0 0 8px #00ff87;
        }
        .premium-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: #aaa;
          font-weight: 700;
        }
      `}</style>

      {/* PREMIUM HEADER SUB-COMPONENT */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4" style={{ borderColor: "#1f0833" }}>
        <div className="d-flex align-items-center gap-2">
          <span className="live-dot"></span>
          <span className="premium-title text-uppercase">Featured Matches</span>
        </div>
       
      </div>

      {/* CORE RENDER CONTROLLER */}
      {loading || !matches.length || currentIndex === null ? (
        /* SKELETON STATE */
        <div className="d-flex align-items-center justify-content-center gap-4 w-100 my-auto">
          <div className="text-center d-flex flex-column align-items-center" style={{ width: "35%" }}>
            <div className="skeleton-pulse rounded-circle" style={{ width: "90px", height: "90px" }}></div>
            <div className="skeleton-pulse rounded mt-3" style={{ width: "70%", height: "18px" }}></div>
          </div>
          <div className="text-center d-flex flex-column align-items-center">
            <div className="skeleton-pulse rounded" style={{ width: "110px", height: "52px" }}></div>
            <div className="skeleton-pulse rounded mt-3" style={{ width: "60px", height: "14px" }}></div>
          </div>
          <div className="text-center d-flex flex-column align-items-center" style={{ width: "35%" }}>
            <div className="skeleton-pulse rounded-circle" style={{ width: "90px", height: "90px" }}></div>
            <div className="skeleton-pulse rounded mt-3" style={{ width: "70%", height: "18px" }}></div>
          </div>
        </div>
      ) : (
        /* ACTIVE CONTENT STATE */
        (() => {
          const match = matches[currentIndex];
          const home = getTeam(match.home_team_id);
          const away = getTeam(match.away_team_id);

          return (
            <div className="d-flex align-items-center justify-content-center gap-4 w-100 my-auto">
              {/* HOME */}
              <div className="text-center" style={{ width: "35%" }}>
                <img
                  src={home.logo}
                  alt={home.name}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                    filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.3))"
                  }}
                />
                <div className="fw-bold mt-2" style={{ fontSize: "17px", letterSpacing: "-0.3px" }}>
                  {home.name}
                </div>
              </div>

              {/* SCORE */}
              <div className="text-center">
                <div
                  className="fw-bold tracking-tight"
                  style={{
                    fontSize: "52px",
                    lineHeight: "52px",
                    color: "#00ff87",
                    letterSpacing: "-1px"
                  }}
                >
                  {match.home_goals}:{match.away_goals}
                </div>
                <div
                  className="mt-2 text-uppercase fw-semibold"
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    letterSpacing: "1px"
                  }}
                >
                  HT {match.home_ht_goals || 0}:{match.away_ht_goals || 0}
                </div>
              </div>

              {/* AWAY */}
              <div className="text-center" style={{ width: "35%" }}>
                <img
                  src={away.logo}
                  alt={away.name}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                    filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.3))"
                  }}
                />
                <div className="fw-bold mt-2" style={{ fontSize: "17px", letterSpacing: "-0.3px" }}>
                  {away.name}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}