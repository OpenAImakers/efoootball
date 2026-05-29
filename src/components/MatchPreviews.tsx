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

// Fisher-Yates Shuffle Engine
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

  useEffect(() => {
    fetchMatches();
  }, []);

  // Set up the initial random rotation queue once matches load
  useEffect(() => {
    if (!matches.length) return;
    
    const initialIndices = matches.map((_, index) => index);
    const shuffled = shuffleArray(initialIndices);
    
    setShuffledQueue(shuffled);
    setCurrentIndex(shuffled[0]);
  }, [matches]);

  // Rotates through the queue cleanly without direct array index duplicates
  useEffect(() => {
    if (!matches.length || shuffledQueue.length <= 1 || currentIndex === null) return;

    const interval = setInterval(() => {
      const currentQueuePosition = shuffledQueue.indexOf(currentIndex);
      const nextQueuePosition = currentQueuePosition + 1;

      if (nextQueuePosition < shuffledQueue.length) {
        // Move to the next random item in the current pool
        setCurrentIndex(shuffledQueue[nextQueuePosition]);
      } else {
        // We reached the end of the current pool. Regenerate a new pool.
        const baseIndices = matches.map((_, index) => index);
        let freshShuffle = shuffleArray(baseIndices);

        // Anti-repetition guard: Ensure the first item of the new pool isn't the same match we just looked at
        if (matches.length > 1 && freshShuffle[0] === currentIndex) {
          // Swap the first element with the last element to break the duplicate sequence
          [freshShuffle[0], freshShuffle[freshShuffle.length - 1]] = [freshShuffle[freshShuffle.length - 1], freshShuffle[0]];
        }

        setShuffledQueue(freshShuffle);
        setCurrentIndex(freshShuffle[0]);
      }
    }, 10000); // 10 seconds display time per card

    return () => clearInterval(interval);
  }, [matches, shuffledQueue, currentIndex]);

  const fetchMatches = async () => {
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name");

    if (matchData) setMatches(matchData);
    if (teamData) setTeams(teamData);
  };

  const getTeam = (id: number) => {
    const team = teams.find((t) => t.id === id);
    const logo = eplTeams[id % eplTeams.length].logo;

    return {
      name: team?.name || "Unknown",
      logo
    };
  };

  if (!matches.length || currentIndex === null) {
    return (
      <div className="text-center text-white p-5">
        No matches available
      </div>
    );
  }

  const match = matches[currentIndex];
  const home = getTeam(match.home_team_id);
  const away = getTeam(match.away_team_id);

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-white"
      style={{
        background: "#0b0014",
        borderRadius: "18px",
        padding: "40px 20px",
        minHeight: "260px"
      }}
    >
      <div
        className="d-flex align-items-center justify-content-center gap-4"
        style={{ width: "100%" }}
      >
        {/* HOME */}
        <div className="text-center" style={{ width: "35%" }}>
          <img
            src={home.logo}
            alt={home.name}
            style={{
              width: "90px",
              height: "90px",
              objectFit: "contain"
            }}
          />
          <div className="fw-bold mt-2" style={{ fontSize: "18px" }}>
            {home.name}
          </div>
        </div>

        {/* SCORE */}
        <div className="text-center">
          <div
            className="fw-bold"
            style={{
              fontSize: "52px",
              lineHeight: "52px",
              color: "#00ff87"
            }}
          >
            {match.home_goals}:{match.away_goals}
          </div>
          <div
            className="mt-2"
            style={{
              fontSize: "14px",
              color: "#aaa"
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
              objectFit: "contain"
            }}
          />
          <div className="fw-bold mt-2" style={{ fontSize: "18px" }}>
            {away.name}
          </div>
        </div>
      </div>
    </div>
  );
}