import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../supabase";

interface Team {
  id: number;
  name: string;
  w: number;
  l: number;
  d: number;
  group_id: number | null;
  ga: number;
  gf: number;
  tournament_id: number;
  league_id: number | null;
  profile_id: string | null;
}

interface TeamStats {
  team: Team;
  totalGames: number;
  winRate: number;
  goalDifference: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  pointsPerGame: number;
  form: string;
  performanceLevel: "On Fire" | "Rising" | "Steady" | "Struggling" | "Critical";
}

type TeamActivity = {
  id: string;
  message: string;
  timestamp: number;
  priority: number;
  teamName: string;
  stats?: Partial<TeamStats>;
};

const ACHIEVEMENT_TEMPLATES = [
  "{team} crushing it with a {winRate}% win rate! {record}",
  "{team} showing pure dominance: {record} record!",
  "What a season for {team}! {record} and climbing!",
  "{team} absolutely unstoppable! {record} so far!",
  "Fans love {team}'s form: {record} this campaign!",
  "{team} making statements every match! {record}",
  "The {team} juggernaut continues! {record}",
  "{team} building a legacy with {record}!"
];

const GOAL_TEMPLATES = [
  "{team} on fire offensively! {gf} goals scored!",
  "Defensive wall! {team} conceded only {ga} goals!",
  "{team} dominates with +{gd} goal difference!",
  "Goal machine! {team} averaging {avgGF}/game!",
  "Fortress at the back! {team} allowing only {avgGA}/game!",
  "Entertainment guaranteed! {team} involved in {totalG}/game thrillers!"
];

const FORM_TEMPLATES = [
  "{team} is {form} - {recent} matches unbeaten!",
  "Momentum with {team}! {form} form continues!",
  "Can anyone stop {team}? {form} streak!",
  "{team} hitting {form} form at perfect time!",
  "{team} showing {form} consistency!"
];

const COMPARISON_TEMPLATES = [
  "{team1} scoring {g1}/game vs {team2}'s {g2}/game - attacking battle!",
  "Goal difference showdown: {team1} (+{gd1}) vs {team2} (+{gd2})",
  "Win rate clash: {team1} ({wr1}%) vs {team2} ({wr2}%)",
  "Defensive test: {team1} ({ga1}) vs {team2} ({ga2}) goals conceded"
];

const TeamsFeed: React.FC = () => {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fadeState, setFadeState] = useState<"visible" | "exiting" | "entering">("visible");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const rotationRef = useRef<NodeJS.Timeout | null>(null);

  const randomBetween = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const randomFromArray = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const generateActivityId = (prefix: string): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const calculateTeamStats = (team: Team): TeamStats => {
    const totalGames = team.w + team.l + team.d;
    const winRate = totalGames > 0 ? (team.w / totalGames) * 100 : 0;
    const goalDifference = (team.gf || 0) - (team.ga || 0);
    const avgGoalsScored = totalGames > 0 ? (team.gf || 0) / totalGames : 0;
    const avgGoalsConceded = totalGames > 0 ? (team.ga || 0) / totalGames : 0;
    const points = (team.w * 3) + team.d;
    const pointsPerGame = totalGames > 0 ? points / totalGames : 0;
    
    let performanceLevel: TeamStats["performanceLevel"] = "Steady";
    if (winRate >= 70) performanceLevel = "On Fire";
    else if (winRate >= 50) performanceLevel = "Rising";
    else if (winRate >= 30) performanceLevel = "Steady";
    else if (winRate >= 10) performanceLevel = "Struggling";
    else performanceLevel = "Critical";
    
    let form = "Mixed";
    if (team.w >= team.l * 2) form = "Excellent";
    else if (team.w > team.l) form = "Good";
    else if (team.w === team.l) form = "Balanced";
    else if (team.l > team.w * 2) form = "Poor";
    else form = "Below Par";
    
    return {
      team,
      totalGames,
      winRate: Math.round(winRate),
      goalDifference,
      avgGoalsScored: Number(avgGoalsScored.toFixed(1)),
      avgGoalsConceded: Number(avgGoalsConceded.toFixed(1)),
      pointsPerGame: Number(pointsPerGame.toFixed(2)),
      form,
      performanceLevel
    };
  };

  const generateAchievementMessage = useCallback((stats: TeamStats): TeamActivity | null => {
    const { team, winRate, totalGames, goalDifference, avgGoalsScored, avgGoalsConceded, performanceLevel, form } = stats;
    
    if (totalGames === 0) return null;
    
    const randomChoice = randomBetween(1, 100);
    const record = `${team.w}W-${team.d}D-${team.l}L`;
    
    if (randomChoice <= 15 && winRate >= 70) {
      const template = randomFromArray(ACHIEVEMENT_TEMPLATES);
      return {
        id: generateActivityId("achievement"),
        message: template
          .replace("{team}", team.name)
          .replace("{winRate}", winRate.toString())
          .replace("{record}", record),
        timestamp: Date.now(),
        priority: 5,
        teamName: team.name,
        stats
      };
    }
    
    if (randomChoice <= 35 && Math.abs(goalDifference) >= 10) {
      const template = randomFromArray(GOAL_TEMPLATES);
      const message = template
        .replace("{team}", team.name)
        .replace("{gf}", team.gf?.toString() || "0")
        .replace("{ga}", team.ga?.toString() || "0")
        .replace("{gd}", Math.abs(goalDifference).toString())
        .replace("{avgGF}", avgGoalsScored.toString())
        .replace("{avgGA}", avgGoalsConceded.toString())
        .replace("{totalG}", (avgGoalsScored + avgGoalsConceded).toFixed(1));
      
      return {
        id: generateActivityId("goals"),
        message: goalDifference > 0 ? message : `${team.name} conceding ${avgGoalsConceded}/game - defensive concerns!`,
        timestamp: Date.now(),
        priority: 4,
        teamName: team.name,
        stats
      };
    }
    
    if (randomChoice <= 60 && (team.w >= 3 || team.l >= 3)) {
      const template = randomFromArray(FORM_TEMPLATES);
      const streak = team.w >= 3 ? `${team.w} games` : team.l >= 3 ? `${team.l} losses` : "";
      const formDesc = team.w >= 3 ? "Blazing" : team.l >= 3 ? "Concerning" : form;
      
      return {
        id: generateActivityId("form"),
        message: template
          .replace("{team}", team.name)
          .replace("{form}", formDesc)
          .replace("{recent}", streak),
        timestamp: Date.now(),
        priority: 3,
        teamName: team.name,
        stats
      };
    }
    
    if (randomChoice <= 85 && totalGames >= 5) {
      const messages = [
        `${team.name}: ${record} | ${performanceLevel} form | P${Math.round(stats.pointsPerGame * 100)}% efficiency`,
        `${team.name} stats: ${record} | ${winRate}% win rate | ${goalDifference > 0 ? `+${goalDifference}` : goalDifference} GD`,
        `${team.name} averaging ${avgGoalsScored}F/${avgGoalsConceded}A per game | ${totalGames} matches played`,
        `${team.name}'s campaign: ${record} | ${stats.pointsPerGame} pts/game | ${performanceLevel}`
      ];
      
      return {
        id: generateActivityId("stats"),
        message: randomFromArray(messages),
        timestamp: Date.now(),
        priority: 2,
        teamName: team.name,
        stats
      };
    }
    
    if (randomChoice <= 100) {
      return {
        id: generateActivityId("basic"),
        message: `${team.name} | ${record} | Goal Diff: ${goalDifference > 0 ? `+${goalDifference}` : goalDifference}`,
        timestamp: Date.now(),
        priority: 1,
        teamName: team.name,
        stats
      };
    }
    
    return null;
  }, []);
  
  const generateComparisonMessage = useCallback((team1: TeamStats, team2: TeamStats): TeamActivity | null => {
    const totalGames = team1.totalGames + team2.totalGames;
    if (totalGames < 10) return null;
    
    const randomChoice = randomBetween(1, 100);
    
    if (randomChoice <= 30) {
      const template = randomFromArray(COMPARISON_TEMPLATES);
      const message = template
        .replace("{team1}", team1.team.name)
        .replace("{team2}", team2.team.name)
        .replace("{g1}", team1.avgGoalsScored.toString())
        .replace("{g2}", team2.avgGoalsScored.toString())
        .replace("{gd1}", team1.goalDifference.toString())
        .replace("{gd2}", team2.goalDifference.toString())
        .replace("{wr1}", team1.winRate.toString())
        .replace("{wr2}", team2.winRate.toString())
        .replace("{ga1}", team1.avgGoalsConceded.toString())
        .replace("{ga2}", team2.avgGoalsConceded.toString());
      
      return {
        id: generateActivityId("comparison"),
        message: message,
        timestamp: Date.now(),
        priority: 4,
        teamName: `${team1.team.name} vs ${team2.team.name}`,
        stats: team1
      };
    }
    
    return null;
  }, []);
  
  const generateLeagueStandingMessage = useCallback((teams: TeamStats[]): TeamActivity | null => {
    if (teams.length < 3) return null;
    
    const sorted = [...teams].sort((a, b) => {
      const pointsA = (a.team.w * 3) + a.team.d;
      const pointsB = (b.team.w * 3) + b.team.d;
      if (pointsB !== pointsA) return pointsB - pointsA;
      return b.goalDifference - a.goalDifference;
    });
    
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const second = sorted[1];
    
    const randomChoice = randomBetween(1, 100);
    
    if (randomChoice <= 40 && top && top.totalGames > 0) {
      const topPoints = (top.team.w * 3) + top.team.d;
      const secondPoints = second ? (second.team.w * 3) + second.team.d : 0;
      const gap = topPoints - secondPoints;
      
      const messages = [
        `League leaders: ${top.team.name} with ${topPoints} points! ${gap > 3 ? `${gap}pts clear!` : "Title race heating up!"}`,
        `Top of the table: ${top.team.name} (${top.team.w}W-${top.team.d}D-${top.team.l}L) | +${top.goalDifference} GD`,
        `${top.team.name} setting the pace with ${top.winRate}% win rate!`,
        bottom ? `Relegation battle: ${bottom.team.name} need points! ${bottom.totalGames} games, ${bottom.winRate}% win rate` : null
      ];
      
      const validMessages = messages.filter(m => m !== null);
      if (validMessages.length > 0) {
        return {
          id: generateActivityId("standing"),
          message: randomFromArray(validMessages as string[]),
          timestamp: Date.now(),
          priority: 4,
          teamName: top.team.name,
          stats: top
        };
      }
    }
    
    return null;
  }, []);
  
  const generateMilestoneMessage = useCallback((stats: TeamStats): TeamActivity | null => {
    const { team, totalGames, goalDifference, avgGoalsScored } = stats;
    
    if (totalGames === 0) return null;
    
    const milestones = [];
    
    if (team.w >= 10 && team.w % 5 === 0) {
      milestones.push(`MILESTONE: ${team.name} reaches ${team.w} wins!`);
    }
    
    if (team.gf >= 50 && team.gf % 25 === 0) {
      milestones.push(`${team.name} hits ${team.gf} goals scored this season!`);
    }
    
    if (goalDifference >= 20 && goalDifference % 10 === 0) {
      milestones.push(`${team.name} achieves +${goalDifference} goal difference!`);
    }
    
    if (avgGoalsScored >= 2.5) {
      milestones.push(`${team.name} averaging ${avgGoalsScored} goals/game - attacking masterclass!`);
    }
    
    if (milestones.length > 0 && Math.random() < 0.3) {
      return {
        id: generateActivityId("milestone"),
        message: randomFromArray(milestones),
        timestamp: Date.now(),
        priority: 5,
        teamName: team.name,
        stats
      };
    }
    
    return null;
  }, []);
const fetchTeamsData = useCallback(async () => {
    try {
      setError(null);
      
      const CACHE_KEY = "teams_feed_cache";
      const CACHE_TIME_KEY = "teams_feed_cache_time";
      const FIVE_MINUTES = 5 * 60 * 1000;

      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      
      let teams: any[] = [];

      // Check if fresh cache exists to prevent a Supabase network request entirely
      if (cachedData && cachedTime && Date.now() - Number(cachedTime) < FIVE_MINUTES) {
        teams = JSON.parse(cachedData);
      } else {
        const { data: fetchedTeams, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .order("name", { ascending: true });
        
        if (teamsError) throw teamsError;
        
        if (fetchedTeams && fetchedTeams.length > 0) {
          teams = fetchedTeams;
          localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedTeams));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }
      }
      
      if (teams.length === 0) {
        setActivities([{
          id: generateActivityId("empty"),
          message: "No teams registered yet. Waiting for teams to join!",
          timestamp: Date.now(),
          priority: 1,
          teamName: "System"
        }]);
        setIsLoading(false);
        return;
      }
      
      const teamStatsList = teams.map(team => calculateTeamStats(team));
      const newActivities: TeamActivity[] = [];
      
      const shuffledTeams = [...teamStatsList].sort(() => Math.random() - 0.5);
      const teamsToShow = shuffledTeams.slice(0, randomBetween(3, 6));
      
      for (const stats of teamsToShow) {
        const activity = generateAchievementMessage(stats);
        if (activity) newActivities.push(activity);
        
        const milestone = generateMilestoneMessage(stats);
        if (milestone && Math.random() < 0.5) newActivities.push(milestone);
      }
      
      if (teamStatsList.length >= 2) {
        const comparisonPairs = [];
        for (let i = 0; i < Math.min(3, teamStatsList.length); i++) {
          const idx1 = randomBetween(0, teamStatsList.length - 1);
          let idx2 = randomBetween(0, teamStatsList.length - 1);
          while (idx2 === idx1 && teamStatsList.length > 1) {
            idx2 = randomBetween(0, teamStatsList.length - 1);
          }
          comparisonPairs.push([teamStatsList[idx1], teamStatsList[idx2]]);
        }
        
        for (const [team1, team2] of comparisonPairs) {
          const comparison = generateComparisonMessage(team1, team2);
          if (comparison) newActivities.push(comparison);
        }
      }
      
      const standingUpdate = generateLeagueStandingMessage(teamStatsList);
      if (standingUpdate) newActivities.push(standingUpdate);
      
      const topTeam = [...teamStatsList].sort((a, b) => {
        const pointsA = (a.team.w * 3) + a.team.d;
        const pointsB = (b.team.w * 3) + b.team.d;
        return pointsB - pointsA;
      })[0];
      
      if (topTeam && topTeam.totalGames > 0 && Math.random() < 0.7) {
        const topPoints = (topTeam.team.w * 3) + topTeam.team.d;
        newActivities.push({
          id: generateActivityId("top_performer"),
          message: `TOP PERFORMER: ${topTeam.team.name} | ${topPoints} pts | ${topTeam.winRate}% wins | +${topTeam.goalDifference} GD`,
          timestamp: Date.now(),
          priority: 5,
          teamName: topTeam.team.name,
          stats: topTeam
        });
      }
      
      if (teamStatsList.length > 0 && Math.random() < 0.4) {
        const randomTeam = randomFromArray(teamStatsList);
        const funFacts = [
          `${randomTeam.team.name} scores ${Math.round(randomTeam.avgGoalsScored * 10)} goals every 10 games on average`,
          `It takes ${randomTeam.team.name} ${randomTeam.totalGames > 0 ? Math.round(randomTeam.totalGames / (randomTeam.team.w || 1)) : "N/A"} games to get a win`,
          `${randomTeam.team.name}'s matches average ${(randomTeam.avgGoalsScored + randomTeam.avgGoalsConceded).toFixed(1)} goals`,
          `${randomTeam.team.name} keeps a clean sheet in ${Math.round(((randomTeam.totalGames - (randomTeam.team.ga / 2)) / randomTeam.totalGames) * 100)}% of games`
        ];
        
        newActivities.push({
          id: generateActivityId("fun_fact"),
          message: `DID YOU KNOW? ${randomFromArray(funFacts)}`,
          timestamp: Date.now(),
          priority: 2,
          teamName: randomTeam.team.name,
          stats: randomTeam
        });
      }
      
      const finalActivities = newActivities
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return Math.random() - 0.5;
        })
        .slice(0, 15);
      
      if (finalActivities.length === 0) {
        finalActivities.push({
          id: generateActivityId("fallback"),
          message: "Team statistics loading... Check back for updates!",
          timestamp: Date.now(),
          priority: 1,
          teamName: "System"
        });
      }
      
      setActivities(finalActivities);
      setCurrentIndex(0);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching teams data:", err);
      setError("Unable to load team statistics");
      setActivities([{
        id: "error_fallback",
        message: "Error loading team data. Click to retry",
        timestamp: Date.now(),
        priority: 0,
        teamName: "System"
      }]);
      setIsLoading(false);
    }
  }, [generateAchievementMessage, generateComparisonMessage, generateLeagueStandingMessage, generateMilestoneMessage]);
  
  // Cleaned effect hook runs EXACTLY once on mount. 
  // No interval timers hitting your DB endpoint anymore!
  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);
  
  // Handles text line cross-fade cycles contextually
  useEffect(() => {
    if (activities.length <= 1) return;
    
    const rotateActivity = () => {
      setFadeState("exiting");
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % activities.length);
        setFadeState("entering");
        
        setTimeout(() => {
          setFadeState("visible");
        }, 50);
      }, 400);
    };
    
    const rotate = () => {
      rotateActivity();
      const delay = Math.floor(Math.random() * (8500 - 5500 + 1) + 5500);
      rotationRef.current = setTimeout(rotate, delay);
    };
    
    rotate();
    
    return () => {
      if (rotationRef.current) clearTimeout(rotationRef.current);
    };
  }, [activities.length]);
  
  const getDynamicStyle = (): React.CSSProperties => {
    switch (fadeState) {
      case "exiting":
        return {
          opacity: 0,
          transform: `translateY(-10px)`,
          transition: "transform 0.4s ease-in, opacity 0.4s ease-in"
        };
      case "entering":
        return {
          opacity: 0,
          transform: `translateY(10px)`,
          transition: "none"
        };
      case "visible":
      default:
        return {
          opacity: 1,
          transform: "translateY(0px)",
          transition: "transform 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1)"
        };
    }
  };
  
  if (isLoading && activities.length === 0) {
    return (
      <div style={styles.container}>
        <span style={{ ...styles.tickerText, opacity: 0.6 }}>
          Loading team performance data...
        </span>
      </div>
    );
  }
  
  if (error && activities.length === 0) {
    return (
      <div style={styles.container}>
        <span 
          style={{ ...styles.tickerText, color: "#ff8866", cursor: "pointer" }}
          onClick={() => fetchTeamsData()}
          onKeyDown={(e) => e.key === "Enter" && fetchTeamsData()}
          role="button"
          tabIndex={0}
        >
          Error: {error} - Click to retry
        </span>
      </div>
    );
  }
  
  const currentActivity = activities[currentIndex];
  
  return (
    <div style={styles.container}>
      <span style={{ ...styles.tickerText, ...getDynamicStyle() }}>
        {currentActivity?.message || "Team statistics loading..."}
      </span>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "inline-block",
  },
  tickerText: {
    color: "#00ff88",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'Courier New', monospace",
    textShadow: "0 0 8px rgba(0, 255, 136, 0.3)",
    display: "inline-block",
  }
};

export default TeamsFeed;