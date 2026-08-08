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
      className="d-flex flex-column bg-white border rounded-3 shadow-sm p-4 overflow-hidden position-relative my-3"
      style={{
        minHeight: "320px",
      }}
    >
      {/* Light-theme Keyframe Animations */}
      <style>{`
        @keyframes shimmer-light {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .skeleton-pulse-light {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer-light 1.6s infinite linear;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 2s infinite ease-in-out;
          box-shadow: 0 0 6px #10b981;
        }
      `}</style>

      {/* HEADER BAR */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="live-dot"></span>
          <span
            className="fw-bold text-uppercase text-muted"
            style={{ fontSize: "0.75rem", letterSpacing: "1px" }}
          >
            Featured Matches
          </span>
        </div>
      </div>

      {/* RENDER BODY */}
      {loading || !matches.length || currentIndex === null ? (
        /* SKELETON STATE */
        <div className="d-flex align-items-center justify-content-center gap-4 w-100 my-auto">
          <div className="text-center d-flex flex-column align-items-center" style={{ width: "35%" }}>
            <div className="skeleton-pulse-light rounded-circle" style={{ width: "80px", height: "80px" }}></div>
            <div className="skeleton-pulse-light rounded mt-3" style={{ width: "70%", height: "16px" }}></div>
          </div>
          <div className="text-center d-flex flex-column align-items-center">
            <div className="skeleton-pulse-light rounded" style={{ width: "100px", height: "48px" }}></div>
            <div className="skeleton-pulse-light rounded mt-3" style={{ width: "50px", height: "12px" }}></div>
          </div>
          <div className="text-center d-flex flex-column align-items-center" style={{ width: "35%" }}>
            <div className="skeleton-pulse-light rounded-circle" style={{ width: "80px", height: "80px" }}></div>
            <div className="skeleton-pulse-light rounded mt-3" style={{ width: "70%", height: "16px" }}></div>
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
              {/* HOME TEAM */}
              <div className="text-center" style={{ width: "35%" }}>
                <img
                  src={home.logo}
                  alt={home.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))"
                  }}
                />
                <div
                  className="fw-bold text-dark mt-2"
                  style={{ fontSize: "1rem", letterSpacing: "-0.2px" }}
                >
                  {home.name}
                </div>
              </div>

              {/* SCORE DISPLAY */}
              <div className="text-center">
                <div
                  className="fw-bold text-primary"
                  style={{
                    fontSize: "3rem",
                    lineHeight: "1",
                    letterSpacing: "-1px"
                  }}
                >
                  {match.home_goals}:{match.away_goals}
                </div>
                <div
                  className="mt-2 text-uppercase fw-semibold text-muted"
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "1px"
                  }}
                >
                  HT {match.home_ht_goals || 0}:{match.away_ht_goals || 0}
                </div>
              </div>

              {/* AWAY TEAM */}
              <div className="text-center" style={{ width: "35%" }}>
                <img
                  src={away.logo}
                  alt={away.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))"
                  }}
                />
                <div
                  className="fw-bold text-dark mt-2"
                  style={{ fontSize: "1rem", letterSpacing: "-0.2px" }}
                >
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