import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function MatchScheduler() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);

  // Create Match State
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [stage, setStage] = useState("GROUP");

  // Update Result State
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: teamsData } = await supabase.from("teams").select("id, name").order("name");
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`
        id, 
        home_team:home_team_id(name), 
        away_team:away_team_id(name), 
        played, 
        stage
      `)
      .order("id", { ascending: false });

    setTeams(teamsData || []);
    setMatches(matchesData || []);
  }

  const handleCreateMatch = async () => {
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      return alert("Please select two different teams.");
    }

    const { error } = await supabase.from("matches").insert({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      stage: stage,
      played: false
    });

    if (error) alert(error.message);
    else {
      alert("Match Scheduled!");
      fetchData();
    }
  };

  const handleUpdateResult = async () => {
    if (!selectedMatchId) return alert("Select a match first");

    const { error } = await supabase
      .from("matches")
      .update({
        home_goals: Number(homeGoals),
        away_goals: Number(awayGoals),
        played: true
      })
      .eq("id", selectedMatchId);

    if (error) alert(error.message);
    else {
      alert("Score Updated!");
      setSelectedMatchId("");
      setHomeGoals(0);
      setAwayGoals(0);
      fetchData();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", border: "1px solid #ddd", borderRadius: "8px" }}>
      
      {/* SECTION: CREATE MATCH */}
      <section>
        <h3>🗓️ Schedule New Match</h3>
        <div style={{ display: "grid", gap: "10px" }}>
                <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All Stages</option>
          <option value="GROUP">Group Stage</option>
          <option value="QUARTER">Quarter Finals</option>
          <option value="SEMI">Semi Finals</option>
          <option value="FINAL">Final</option>
          <option value="THIRD_PLACE">Third Place Playoff</option>
        </select>

          <div style={{ display: "flex", gap: "10px" }}>
            <select style={{ flex: 1 }} value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)}>
              <option value="">Home Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span style={{ alignSelf: "center" }}>VS</span>
            <select style={{ flex: 1 }} value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)}>
              <option value="">Away Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreateMatch} style={{ background: "#4CAF50", color: "white", padding: "10px", border: "none", cursor: "pointer" }}>
            Create Match
          </button>
        </div>
      </section>

      <hr style={{ margin: "30px 0" }} />

      {/* SECTION: UPDATE SCORE */}
      <section>
        <h3>⚽ Update Match Score</h3>
        <select 
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          value={selectedMatchId} 
          onChange={(e) => setSelectedMatchId(e.target.value)}
        >
          <option value="">Select a match to score</option>
          {matches.filter(m => !m.played).map(m => (
            <option key={m.id} value={m.id}>
              {m.home_team?.name} vs {m.away_team?.name} ({m.stage})
            </option>
          ))}
        </select>

        {selectedMatchId && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input 
              type="number" 
              placeholder="Home" 
              value={homeGoals} 
              onChange={(e) => setHomeGoals(e.target.value)} 
              style={{ width: "60px", padding: "5px" }}
            />
            <span>-</span>
            <input 
              type="number" 
              placeholder="Away" 
              value={awayGoals} 
              onChange={(e) => setAwayGoals(e.target.value)} 
              style={{ width: "60px", padding: "5px" }}
            />
            <button onClick={handleUpdateResult} style={{ background: "#2196F3", color: "white", padding: "8px 15px", border: "none", cursor: "pointer" }}>
              Submit Score
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default MatchScheduler;