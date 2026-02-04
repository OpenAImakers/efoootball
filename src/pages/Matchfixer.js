import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function MatchScheduler() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Match State
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [stage, setStage] = useState("GROUP");
  const [stagegroup, setStagegroup] = useState("");

  // Update Result State
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);

  // Delete Match State
  const [matchToDeleteId, setMatchToDeleteId] = useState("");

  // Load tournaments and auto-select the most recent one
  useEffect(() => {
    async function loadTournaments() {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading tournaments:", error);
        return;
      }

      if (data?.length > 0) {
        setTournaments(data);
        // Auto-select the newest tournament
        setSelectedTournamentId(data[0].id);
      }
    }
    loadTournaments();
  }, []);

  // Load teams & matches when tournament changes
  useEffect(() => {
    if (!selectedTournamentId) {
      setTeams([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);

      // Fetch teams for selected tournament
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("tournament_id", selectedTournamentId)
        .order("name");

      // Fetch matches for selected tournament
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id, 
          home_team:home_team_id(name), 
          away_team:away_team_id(name), 
          played, 
          stage,
          group_id
        `)
        .eq("tournament_id", selectedTournamentId)
        .order("id", { ascending: false });

      if (teamsError || matchesError) {
        console.error("Fetch error:", teamsError || matchesError);
      }

      setTeams(teamsData || []);
      setMatches(matchesData || []);
      setLoading(false);
    }

    fetchData();
  }, [selectedTournamentId]);

  const handleCreateMatch = async () => {
    if (!selectedTournamentId) {
      alert("No tournament selected.");
      return;
    }
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      alert("Please select two different teams.");
      return;
    }

    const homeTeam = teams.find((t) => t.id === homeTeamId)?.name || "???";
    const awayTeam = teams.find((t) => t.id === awayTeamId)?.name || "???";
    const stageText = stage === "GROUP" ? `Group ${stagegroup || "?"}` : stage;

    const confirmed = window.confirm(
      `Schedule this match?\n\n${homeTeam} vs ${awayTeam}\nStage: ${stageText}`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("matches").insert({
      tournament_id: selectedTournamentId,          // ← Automatically set here
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      stage: stage,
      played: false,
      group_id: stagegroup || null,
    });

    if (error) {
      alert("Error creating match: " + error.message);
      return;
    }

    alert("Match scheduled successfully!");
    
    // Reset form
    setHomeTeamId("");
    setAwayTeamId("");
    setStage("GROUP");
    setStagegroup("");

    // Refresh matches list
    const { data: refreshedMatches } = await supabase
      .from("matches")
      .select(`
        id, 
        home_team:home_team_id(name), 
        away_team:away_team_id(name), 
        played, 
        stage,
        group_id
      `)
      .eq("tournament_id", selectedTournamentId)
      .order("id", { ascending: false });

    setMatches(refreshedMatches || []);
  };

  const handleUpdateResult = async () => {
    if (!selectedMatchId) {
      alert("Please select a match first.");
      return;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        home_goals: Number(homeGoals),
        away_goals: Number(awayGoals),
        played: true,
      })
      .eq("id", selectedMatchId);

    if (error) {
      alert("Error updating score: " + error.message);
      return;
    }

    alert("Score updated!");
    setSelectedMatchId("");
    setHomeGoals(0);
    setAwayGoals(0);

    // Refresh matches
    const { data } = await supabase
      .from("matches")
      .select(`
        id, 
        home_team:home_team_id(name), 
        away_team:away_team_id(name), 
        played, 
        stage,
        group_id
      `)
      .eq("tournament_id", selectedTournamentId)
      .order("id", { ascending: false });

    setMatches(data || []);
  };

  const handleDeleteMatch = async () => {
    if (!matchToDeleteId) {
      alert("Please select a match to delete.");
      return;
    }

    if (!window.confirm("Delete this match? This cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchToDeleteId);

    if (error) {
      alert("Error deleting match: " + error.message);
      return;
    }

    alert("Match deleted.");
    setMatchToDeleteId("");

    // Refresh matches
    const { data } = await supabase
      .from("matches")
      .select(`
        id, 
        home_team:home_team_id(name), 
        away_team:away_team_id(name), 
        played, 
        stage,
        group_id
      `)
      .eq("tournament_id", selectedTournamentId)
      .order("id", { ascending: false });

    setMatches(data || []);
  };

  const currentTournamentName =
    tournaments.find((t) => t.id === selectedTournamentId)?.name || "Unknown Tournament";

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Match Scheduler</h2>

      {/* Tournament Selector */}
      <div className="mb-4">
        <label htmlFor="tournamentSelect" className="form-label fw-bold">
          Tournament
        </label>
        <select
          id="tournamentSelect"
          className="form-select"
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <small className="text-muted d-block mt-1">
          Currently managing: {currentTournamentName}
        </small>
      </div>

      {selectedTournamentId ? (
        <>
          {/* CREATE MATCH */}
          <div className="mb-5 card p-4 shadow-sm">
            <h5 className="mb-3">Schedule New Match</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="GROUP">Group Stage</option>
                  <option value="QUARTER">Quarter Finals</option>
                  <option value="SEMI">Semi Finals</option>
                  <option value="FINAL">Final</option>
                  <option value="THIRD_PLACE">Third Place Playoff</option>
                </select>
              </div>

              <div className="col-md-4">
                <select
                  className="form-select"
                  value={stagegroup}
                  onChange={(e) => setStagegroup(e.target.value)}
                >
                  <option value="">No Group</option>
                  <option value="1">Group 1</option>
                  <option value="2">Group 2</option>
                  <option value="3">Group 3</option>
                  <option value="4">Group 4</option>
                </select>
              </div>

              <div className="col-12">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <select
                    className="form-select flex-grow-1"
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
                  >
                    <option value="">Select Home Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <span className="fw-bold">VS</span>

                  <select
                    className="form-select flex-grow-1"
                    value={awayTeamId}
                    onChange={(e) => setAwayTeamId(e.target.value)}
                  >
                    <option value="">Select Away Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-12">
                <button className="btn btn-success w-100" onClick={handleCreateMatch}>
                  Create Match
                </button>
              </div>
            </div>
          </div>

          {/* UPDATE SCORE */}
          <div className="mb-5 card p-4 shadow-sm">
            <h5 className="mb-3">Update Match Score</h5>
            <select
              className="form-select mb-3"
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
            >
              <option value="">Select a match to update</option>
              {matches.filter((m) => !m.played).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.home_team?.name} vs {m.away_team?.name} ({m.stage || "—"})
                </option>
              ))}
            </select>

            {selectedMatchId && (
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <input
                  type="number"
                  min="0"
                  className="form-control text-center"
                  style={{ width: "90px" }}
                  value={homeGoals}
                  onChange={(e) => setHomeGoals(e.target.value)}
                  placeholder="Home"
                />
                <span className="fw-bold fs-4">-</span>
                <input
                  type="number"
                  min="0"
                  className="form-control text-center"
                  style={{ width: "90px" }}
                  value={awayGoals}
                  onChange={(e) => setAwayGoals(e.target.value)}
                  placeholder="Away"
                />
                <button className="btn btn-primary" onClick={handleUpdateResult}>
                  Submit Score
                </button>
              </div>
            )}
          </div>

          {/* DELETE MATCH */}
          <div className="card p-4 shadow-sm">
            <h5 className="mb-3 text-danger">Delete Match</h5>
            <p className="text-muted small mb-3">
              Only unplayed matches can be deleted.
            </p>
            <select
              className="form-select mb-3"
              value={matchToDeleteId}
              onChange={(e) => setMatchToDeleteId(e.target.value)}
            >
              <option value="">Select match to delete</option>
              {matches.filter((m) => !m.played).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.home_team?.name} vs {m.away_team?.name} ({m.stage || "—"})
                </option>
              ))}
            </select>

            <button
              className="btn btn-danger w-100"
              onClick={handleDeleteMatch}
              disabled={!matchToDeleteId}
            >
              Delete Selected Match
            </button>
          </div>
        </>
      ) : (
        <div className="alert alert-warning">
          No tournaments found or failed to load. Please add one in the admin panel.
        </div>
      )}
    </div>
  );
}

export default MatchScheduler;