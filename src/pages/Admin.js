import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Match from "./Matchfixer";
import ManagerPanel from "./ManagerPanel";

function MatchManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual GF/GA update fields
  const [selectedTeam, setSelectedTeam] = useState("");
  const [addToGF, setAddToGF] = useState(0);
  const [addToGA, setAddToGA] = useState(0);

  // Load tournaments and auto-select newest
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
        setSelectedTournamentId(data[0].id); // auto-select newest
      }
    }
    loadTournaments();
  }, []);

  // Load teams when tournament changes
  useEffect(() => {
    if (selectedTournamentId === null) {
      setTeams([]);
      setLoading(false);
      return;
    }

    async function fetchTeams() {
      setLoading(true);
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, gf, ga")
        .eq("tournament_id", selectedTournamentId)
        .order("name");

      if (error) {
        console.error("Error fetching teams:", error);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    }

    fetchTeams();
  }, [selectedTournamentId]);

  async function addGoals() {
    if (!selectedTeam) {
      alert("Select a team first");
      return;
    }

    const gfIncrement = Number(addToGF) || 0;
    const gaIncrement = Number(addToGA) || 0;

    if (gfIncrement === 0 && gaIncrement === 0) {
      alert("Enter at least one value to add");
      return;
    }

    // Get current GF/GA
    const { data: team, error: fetchError } = await supabase
      .from("teams")
      .select("gf, ga, name")
      .eq("id", selectedTeam)
      .single();

    if (fetchError || !team) {
      alert("Failed to fetch team stats");
      return;
    }

    const newGF = (team.gf || 0) + gfIncrement;
    const newGA = (team.ga || 0) + gaIncrement;

    // Update
    const { error: updateError } = await supabase
      .from("teams")
      .update({
        gf: newGF,
        ga: newGA,
      })
      .eq("id", selectedTeam);

    if (updateError) {
      alert("Failed to update goals: " + updateError.message);
      return;
    }

    alert(`GF +${gfIncrement}, GA +${gaIncrement} applied to ${team.name}!`);
    setAddToGF(0);
    setAddToGA(0);

    // Refresh teams
    const { data: refreshed } = await supabase
      .from("teams")
      .select("id, name, gf, ga")
      .eq("tournament_id", selectedTournamentId)
      .order("name");

    setTeams(refreshed || []);
  }

  const currentTournament = tournaments.find((t) => t.id === selectedTournamentId);

  return (
    <div className="container py-5">
      <Navbar />
      <ManagerPanel />

      {/* Match scheduling/results component */}
      <Match />

      <hr className="my-5" />

      {/* Tournament Selector */}
      <div className="mb-4">
        <label className="form-label fw-bold">Select Tournament</label>
        <select
          className="form-select"
          value={selectedTournamentId ?? ""}
          onChange={(e) => setSelectedTournamentId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Choose Tournament --</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournamentId === null ? (
        <div className="alert alert-info text-center">
          Please select a tournament to manage team goals.
        </div>
      ) : loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mb-4">Manual Goal Adjustments (GF / GA)</h2>
          <p className="text-muted mb-4">
            Adjust goals for teams in <strong>{currentTournament?.name || "selected tournament"}</strong>
          </p>

          <div className="card p-4 mb-5 shadow-sm">
            <div className="row g-3">
              <div className="col-md-6">
                <select
                  className="form-select mb-3"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="">Select Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (GF: {t.gf || 0} | GA: {t.ga || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Add to GF</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={addToGF}
                  onChange={(e) => setAddToGF(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Add to GA</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={addToGA}
                  onChange={(e) => setAddToGA(e.target.value)}
                />
              </div>

              <div className="col-12">
                <button className="btn btn-success w-100" onClick={addGoals}>
                  Apply Adjustment
                </button>
              </div>
            </div>
          </div>

          {/* Overview Table */}
          <h3 className="mb-4">Live Goal Overview</h3>
          {teams.length === 0 ? (
            <div className="alert alert-light text-center py-5">
              No teams found in this tournament yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Team</th>
                    <th className="text-center">Goals For (GF)</th>
                    <th className="text-center">Goals Against (GA)</th>
                    <th className="text-center">Goal Difference (GD)</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-bold">{t.name}</td>
                      <td className="text-center">{t.gf || 0}</td>
                      <td className="text-center">{t.ga || 0}</td>
                      <td className="text-center fw-bold">
                        {(t.gf || 0) - (t.ga || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MatchManager;