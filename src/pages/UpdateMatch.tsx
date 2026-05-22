import { useState } from "react";
import { supabase } from "../supabase";

function UpdateMatchScore({ matches, selectedTournamentId, onMatchUpdated }) {
  // Base State
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);

  // Toggle for advanced stats view
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 14 Additional Advanced Match Parameters (Nullable state)
  const [homeHtGoals, setHomeHtGoals] = useState("");
  const [awayHtGoals, setAwayHtGoals] = useState("");
  const [homePossession, setHomePossession] = useState("");
  const [awayPossession, setAwayPossession] = useState("");
  const [homeShots, setHomeShots] = useState("");
  const [awayShots, setAwayShots] = useState("");
  const [homeShotsOnTarget, setHomeShotsOnTarget] = useState("");
  const [awayShotsOnTarget, setAwayShotsOnTarget] = useState("");
  const [homeFouls, setHomeFouls] = useState("");
  const [awayFouls, setAwayFouls] = useState("");
  const [homeOffsides, setHomeOffsides] = useState("");
  const [awayOffsides, setAwayOffsides] = useState("");
  const [homeCornerKicks, setHomeCornerKicks] = useState("");
  const [awayCornerKicks, setAwayCornerKicks] = useState("");
  const [homeFreeKicks, setHomeFreeKicks] = useState("");
  const [awayFreeKicks, setAwayFreeKicks] = useState("");
  const [homePasses, setHomePasses] = useState("");
  const [awayPasses, setAwayPasses] = useState("");
  const [homeSuccessfulPasses, setHomeSuccessfulPasses] = useState("");
  const [awaySuccessfulPasses, setAwaySuccessfulPasses] = useState("");
  const [homeCrosses, setHomeCrosses] = useState("");
  const [awayCrosses, setAwayCrosses] = useState("");
  const [homeInterceptions, setHomeInterceptions] = useState("");
  const [awayInterceptions, setAwayInterceptions] = useState("");
  const [homeTackles, setHomeTackles] = useState("");
  const [awayTackles, setAwayTackles] = useState("");
  const [homeSaves, setHomeSaves] = useState("");
  const [awaySaves, setAwaySaves] = useState("");

  // Helper to parse empty strings back to safe database NULL values
  const formatValue = (val) => (val === "" ? null : Number(val));

  const handleUpdateResult = async () => {
    if (!selectedMatchId) return alert("Select a match first.");

    const { error } = await supabase
      .from("matches")
      .update({
        home_goals: Number(homeGoals),
        away_goals: Number(awayGoals),
        played: true,
        // All 14 custom pairs mapped smoothly here
        home_ht_goals: formatValue(homeHtGoals),
        away_ht_goals: formatValue(awayHtGoals),
        home_possession: formatValue(homePossession),
        away_possession: formatValue(awayPossession),
        home_shots: formatValue(homeShots),
        away_shots: formatValue(awayShots),
        home_shots_on_target: formatValue(homeShotsOnTarget),
        away_shots_on_target: formatValue(awayShotsOnTarget),
        home_fouls: formatValue(homeFouls),
        away_fouls: formatValue(awayFouls),
        home_offsides: formatValue(homeOffsides),
        away_offsides: formatValue(awayOffsides),
        home_corner_kicks: formatValue(homeCornerKicks),
        away_corner_kicks: formatValue(awayCornerKicks),
        home_free_kicks: formatValue(homeFreeKicks),
        away_free_kicks: formatValue(awayFreeKicks),
        home_passes: formatValue(homePasses),
        away_passes: formatValue(awayPasses),
        home_successful_passes: formatValue(homeSuccessfulPasses),
        away_successful_passes: formatValue(awaySuccessfulPasses),
        home_crosses: formatValue(homeCrosses),
        away_crosses: formatValue(awayCrosses),
        home_interceptions: formatValue(homeInterceptions),
        away_interceptions: formatValue(awayInterceptions),
        home_tackles: formatValue(homeTackles),
        away_tackles: formatValue(awayTackles),
        home_saves: formatValue(homeSaves),
        away_saves: formatValue(awaySaves),
      })
      .eq("id", selectedMatchId);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    alert("Score and full metrics saved successfully!");
    
    // Reset all states back to default values
    setSelectedMatchId("");
    setHomeGoals(0);
    setAwayGoals(0);
    setShowAdvanced(false);
    
    setHomeHtGoals(""); setAwayHtGoals("");
    setHomePossession(""); setAwayPossession("");
    setHomeShots(""); setAwayShots("");
    setHomeShotsOnTarget(""); setAwayShotsOnTarget("");
    setHomeFouls(""); setAwayFouls("");
    setHomeOffsides(""); setAwayOffsides("");
    setHomeCornerKicks(""); setAwayCornerKicks("");
    setHomeFreeKicks(""); setAwayFreeKicks("");
    setHomePasses(""); setAwayPasses("");
    setHomeSuccessfulPasses(""); setAwaySuccessfulPasses("");
    setHomeCrosses(""); setAwayCrosses("");
    setHomeInterceptions(""); setAwayInterceptions("");
    setHomeTackles(""); setAwayTackles("");
    setHomeSaves(""); setAwaySaves("");

    onMatchUpdated();
  };

  // Quick structure helper to cleanly render grid rows
  const renderStatRow = (label, homeVal, setHomeVal, awayVal, setAwayVal) => (
    <div className="row g-2 align-items-center mb-2">
      <div className="col-4">
        <input
          type="number"
          min="0"
          className="form-control text-center"
          value={homeVal}
          onChange={(e) => setHomeVal(e.target.value)}
          placeholder="Home"
        />
      </div>
      <div className="col-4 text-center small fw-bold text-muted">{label}</div>
      <div className="col-4">
        <input
          type="number"
          min="0"
          className="form-control text-center"
          value={awayVal}
          onChange={(e) => setAwayVal(e.target.value)}
          placeholder="Away"
        />
      </div>
    </div>
  );

  return (
    <div className="mb-5 card p-4 shadow-sm">
      <h5 className="mb-3">Update Match Score</h5>
      <select
        className="form-select mb-3"
        value={selectedMatchId}
        onChange={(e) => setSelectedMatchId(e.target.value)}
      >
        <option value="">Select unplayed match</option>
        {matches
          .filter((m) => !m.played)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.home_team?.name} vs {m.away_team?.name} ({m.stage} - R{m.round})
            </option>
          ))}
      </select>

      {selectedMatchId && (
        <div>
          {/* Main Score Inputs */}
          <div className="d-flex align-items-center gap-3 flex-wrap mb-4 bg-light p-3 rounded">
            <div className="flex-grow-1 text-center fw-bold small">Full Time Goals</div>
            <div className="d-flex align-items-center gap-2">
              <input
                type="number"
                min="0"
                className="form-control text-center fw-bold fs-5"
                style={{ width: "90px" }}
                value={homeGoals}
                onChange={(e) => setHomeGoals(Number(e.target.value))}
                placeholder="Home FT"
              />
              <span className="fw-bold fs-4">-</span>
              <input
                type="number"
                min="0"
                className="form-control text-center fw-bold fs-5"
                style={{ width: "90px" }}
                value={awayGoals}
                onChange={(e) => setAwayGoals(Number(e.target.value))}
                placeholder="Away FT"
              />
            </div>
          </div>

          {/* Toggle Button for Detailed Performance Data */}
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100 mb-3"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "▲ Hide Advanced Metrics" : "▼ Add Advanced Match Statistics"}
            </button>
          </div>

          {showAdvanced && (
            <div className="p-3 border rounded bg-white mb-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <div className="row mb-2 text-center small fw-bold text-secondary">
                <div className="col-4">Home Stat</div>
                <div className="col-4">Metric</div>
                <div className="col-4">Away Stat</div>
              </div>
              
              {renderStatRow("Half Time Goals", homeHtGoals, setHomeHtGoals, awayHtGoals, setAwayHtGoals)}
              {renderStatRow("Possession (%)", homePossession, setHomePossession, awayPossession, setAwayPossession)}
              {renderStatRow("Shots", homeShots, setHomeShots, awayShots, setAwayShots)}
              {renderStatRow("Shots on Target", homeShotsOnTarget, setHomeShotsOnTarget, awayShotsOnTarget, setAwayShotsOnTarget)}
              {renderStatRow("Fouls", homeFouls, setHomeFouls, awayFouls, setAwayFouls)}
              {renderStatRow("Offsides", homeOffsides, setHomeOffsides, awayOffsides, setAwayOffsides)}
              {renderStatRow("Corner Kicks", homeCornerKicks, setHomeCornerKicks, awayCornerKicks, setAwayCornerKicks)}
              {renderStatRow("Free Kicks", homeFreeKicks, setHomeFreeKicks, awayFreeKicks, setAwayFreeKicks)}
              {renderStatRow("Passes", homePasses, setHomePasses, awayPasses, setAwayPasses)}
              {renderStatRow("Successful Passes", homeSuccessfulPasses, setHomeSuccessfulPasses, awaySuccessfulPasses, setAwaySuccessfulPasses)}
              {renderStatRow("Crosses", homeCrosses, setHomeCrosses, awayCrosses, setAwayCrosses)}
              {renderStatRow("Interceptions", homeInterceptions, setHomeInterceptions, awayInterceptions, setAwayInterceptions)}
              {renderStatRow("Tackles", homeTackles, setHomeTackles, awayTackles, setAwayTackles)}
              {renderStatRow("Saves", homeSaves, setHomeSaves, awaySaves, setAwaySaves)}
            </div>
          )}

          <button className="btn btn-primary w-100 py-2 fw-bold" onClick={handleUpdateResult}>
            Submit Complete Match Record
          </button>
        </div>
      )}
    </div>
  );
}

export default UpdateMatchScore;