import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getActiveTournament } from "../Utils/TournamentSession";
import UpdateMatchScore from "./UpdateMatch"; 

function MatchScheduler() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Match State
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [stage, setStage] = useState("GROUP");
  const [stagegroup, setStagegroup] = useState("");
  const [round, setRound] = useState(0); 

  // Delete Match State
  const [matchToDeleteId, setMatchToDeleteId] = useState("");

  // --- Inline Confirmation & Alert States ---
  const [pendingMatchData, setPendingMatchData] = useState(null);
  const [pendingDeleteData, setPendingDeleteData] = useState(null);
  const [customAlert, setCustomAlert] = useState({ show: false, message: "", type: "success" });

  const activeSession = getActiveTournament(); // null or { id, name }

  // Helper to show custom notifications
  const showAlert = (message, type = "success") => {
    setCustomAlert({ show: true, message, type });
    setTimeout(() => setCustomAlert({ show: false, message: "", type: "success" }), 4000);
  };

  // Helper function to refresh matches used across operations
  const refreshMatches = async () => {
    if (!selectedTournamentId) return;
    const { data } = await supabase
      .from("matches")
      .select(`
        id, home_team:home_team_id(name), away_team:away_team_id(name), 
        played, stage, round, group_id
      `)
      .eq("tournament_id", selectedTournamentId)
      .order("id", { ascending: false });

    setMatches(data || []);
  };

  // 1. Load tournaments — no ownership filter + respect active session
  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);
      setErrorMsg("");

      let query = supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (activeSession?.id) {
        query = query.eq("id", activeSession.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading tournaments:", error);
        setErrorMsg("Failed to load tournaments.");
        setLoading(false);
        return;
      }

      setTournaments(data || []);

      if (data?.length > 0) {
        if (activeSession?.id && data.some(t => t.id === activeSession.id)) {
          setSelectedTournamentId(activeSession.id);
        } else {
          setSelectedTournamentId(data[0].id);
        }
      }

      setLoading(false);
    }

    loadTournaments();
  }, [activeSession?.id]);

  // 2. Load teams & matches when tournament changes
  useEffect(() => {
    if (!selectedTournamentId) {
      setTeams([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("tournament_id", selectedTournamentId)
        .order("name");

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id, 
          home_team:home_team_id(name), 
          away_team:away_team_id(name), 
          played, 
          stage,
          round,
          group_id
        `)
        .eq("tournament_id", selectedTournamentId)
        .order("id", { ascending: false });

      if (teamsError || matchesError) {
        console.error("Fetch error:", teamsError || matchesError);
        setErrorMsg("Failed to load teams or matches.");
      }

      setTeams(teamsData || []);
      setMatches(matchesData || []);
      setLoading(false);
    }

    fetchData();
  }, [selectedTournamentId]);

  // Handle Init Create (shows card preview instead of window.confirm)
  const handleCreateMatchInitiate = () => {
    if (!selectedTournamentId || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      showAlert("Please select a tournament and two different teams.", "danger");
      return;
    }

    const homeName = teams.find(t => t.id === homeTeamId)?.name || "?";
    const awayName = teams.find(t => t.id === awayTeamId)?.name || "?";
    const stageText = stage === "GROUP" ? `Group ${stagegroup || "?"}` : stage;

    setPendingMatchData({ homeName, awayName, stageText });
  };

  // Final confirmation to insert match details
  const confirmCreateMatch = async () => {
    const { error } = await supabase.from("matches").insert({
      tournament_id: selectedTournamentId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      stage,
      round,
      played: false,
      group_id: stagegroup || null,
    });

    if (error) {
      showAlert("Error: " + error.message, "danger");
      return;
    }

    showAlert("Match created successfully!", "success");
    setHomeTeamId("");
    setAwayTeamId("");
    setStage("GROUP");
    setStagegroup("");
    setRound(1); // Reset round
    setPendingMatchData(null); // Close confirmation card

    refreshMatches();
  };

  // Handle Init Delete
  const handleDeleteMatchInitiate = () => {
    if (!matchToDeleteId) return showAlert("Select a match to delete.", "danger");
    
    const selectedMatch = matches.find(m => m.id === matchToDeleteId);
    setPendingDeleteData({
      text: `${selectedMatch?.home_team?.name} vs ${selectedMatch?.away_team?.name}`
    });
  };

  // Final execution of match deletion
  const confirmDeleteMatch = async () => {
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchToDeleteId);

    if (error) {
      showAlert("Error: " + error.message, "danger");
      return;
    }

    showAlert("Match deleted successfully.", "warning");
    setMatchToDeleteId("");
    setPendingDeleteData(null); // Close confirmation card

    refreshMatches();
  };

  const isLockedMode = !!activeSession?.id;
  const currentName = isLockedMode
    ? activeSession.name || "Locked Tournament"
    : tournaments.find(t => t.id === selectedTournamentId)?.name || "—";

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return <div className="container py-5 text-danger">{errorMsg}</div>;
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">
        {isLockedMode ? `Match Scheduler – ${currentName}` : "Match Scheduler"}
      </h2>

      {/* Dynamic Inline Alert System */}
      {customAlert.show && (
        <div className={`alert alert-${customAlert.type} alert-dismissible fade show`} role="alert">
          {customAlert.message}
        </div>
      )}

      {!isLockedMode && (
        <div className="mb-4">
          <label htmlFor="tournamentSelect" className="form-label fw-bold">Select Tournament</label>
          <select
            id="tournamentSelect"
            className="form-select"
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            <option value="">— Choose one —</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedTournamentId ? (
        <>
          <div className="mb-5 card p-4 shadow-sm">
            <h5 className="mb-3">Schedule New Match</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-bold">Stage</label>
                <select
                  className="form-select"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="GROUP">Group Stage</option>
                  <option value="OPENING_ROUND">Opening Round</option>
                  <option value="WINNERS_BRACKET">Winners Bracket</option>
                  <option value="LOSERS_BRACKET">Losers Bracket</option>
                  <option value="GRAND_FINAL">Grand Final</option>
                  <option value="GRAND_FINAL_RESET">Grand Final Reset</option>
                  <option value="QUARTER">Quarter Finals</option>
                  <option value="SEMI">Semi Finals</option>
                  <option value="FINAL">Final</option>
                  <option value="THIRD_PLACE">Third Place Playoff</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold">Round</label>
                <select
                  className="form-select"
                  value={round}
                  onChange={(e) => setRound(Number(e.target.value))}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>Round {num}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold">Group (If Applicable)</label>
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
                  <option value="5">Group 5</option>
                  <option value="6">Group 6</option>
                  <option value="7">Group 7</option>
                  <option value="8">Group 8</option>
                  <option value="9">Group 9</option>
                  <option value="10">Group 10</option>
                  <option value="11">Group 11</option>
                  <option value="12">Group 12</option>
                </select>
              </div>

              <div className="col-12">
                <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
                  <select
                    className="form-select flex-grow-1"
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
                  >
                    <option value="">Home Team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>

                  <span className="fw-bold fs-5">VS</span>

                  <select
                    className="form-select flex-grow-1"
                    value={awayTeamId}
                    onChange={(e) => setAwayTeamId(e.target.value)}
                  >
                    <option value="">Away Team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="col-12">
                {!pendingMatchData ? (
                  <button className="btn btn-success w-100" onClick={handleCreateMatchInitiate}>
                    Create Match
                  </button>
                ) : (
                  /* Custom Match Confirmation Card UI replacement */
                  <div className="card border-success mt-2">
                    <div className="card-body bg-light">
                      <h6 className="card-title text-success fw-bold">Confirm Match Details</h6>
                                            <p className="card-text mb-2">
                        <strong>Stage:</strong> {pendingMatchData.stageText} |{" "}
                        <strong>Round:</strong>{" "}
                        {round === 0 || round === null || round === undefined ? "No rounds" : round}
                      </p>
                      <div className="d-flex gap-2">
                        <button className="btn btn-success btn-sm flex-grow-1" onClick={confirmCreateMatch}>
                          Confirm & Schedule
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setPendingMatchData(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RENDER NEW SUB-COMPONENT */}
          <UpdateMatchScore 
            matches={matches} 
            selectedTournamentId={selectedTournamentId} 
            onMatchUpdated={refreshMatches} 
          />

          {/* DELETE MATCH */}
          <div className="card p-4 shadow-sm mt-4">
            <h5 className="mb-3 text-danger">Delete Match</h5>
            <select
              className="form-select mb-3"
              value={matchToDeleteId}
              onChange={(e) => {
                setMatchToDeleteId(e.target.value);
                setPendingDeleteData(null); // Clear pending delete if choice changes
              }}
            >
              <option value="">Select unplayed match</option>
              {matches.filter((m) => !m.played).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.home_team?.name} vs {m.away_team?.name} ({m.stage} - R{m.round})
                </option>
              ))}
            </select>

            {!pendingDeleteData ? (
              <button
                className="btn btn-danger w-100"
                onClick={handleDeleteMatchInitiate}
                disabled={!matchToDeleteId}
              >
                Delete Selected Match
              </button>
            ) : (
              /* Custom Delete Confirmation Card UI replacement */
              <div className="card border-danger mt-2">
                <div className="card-body bg-light">
                  <h6 className="card-title text-danger fw-bold">Permanently delete this match?</h6>
                  <p className="card-text small text-muted mb-3">
                    Are you sure you want to remove <strong>{pendingDeleteData.text}</strong>? This action cannot be undone.
                  </p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-danger btn-sm flex-grow-1" onClick={confirmDeleteMatch}>
                      Yes, Delete Permanently
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setPendingDeleteData(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="alert alert-info">No tournaments available to manage.</div>
      )}
    </div>
  );
}

export default MatchScheduler;