import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Match from "./Matchfixer";
import ManagerPanel from "./ManagerPanel";
import { getActiveTournament } from "../Utils/TournamentSession";

function MatchManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(() => {
    const session = getActiveTournament();
    return session ? session.id : null;
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [addToGF, setAddToGF] = useState(0);
  const [addToGA, setAddToGA] = useState(0);

  const activeSession = getActiveTournament();

  // --- SESSION LOGOUT LOGIC ---
  const handleExitTournament = () => {
    localStorage.removeItem("active_tournament");
    window.location.reload();
  };

// Load tournaments — no ownership filter + respect active session
  useEffect(() => {
    async function loadTournaments() {
      let query = supabase
        .from("tournaments")
        .select("id, name")
        .order("created_at", { ascending: false });

      // If active session exists → only load that tournament
      if (activeSession?.id) {
        query = query.eq("id", activeSession.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading tournaments:", error);
        return;
      }

      setTournaments(data || []);

      // Auto-select logic
      if (data?.length > 0) {
        if (activeSession?.id && data.some(t => t.id === activeSession.id)) {
          setSelectedTournamentId(activeSession.id);
        } else if (!selectedTournamentId) {
          setSelectedTournamentId(data[0].id);
        }
      }
    }

    loadTournaments();
    // Added dependencies here to clear the warning
  }, [activeSession?.id, selectedTournamentId]);

  // Load teams for selected tournament
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

    const { error: updateError } = await supabase
      .from("teams")
      .update({ gf: newGF, ga: newGA })
      .eq("id", selectedTeam);

    if (updateError) {
      alert("Failed to update goals: " + updateError.message);
      return;
    }

    alert(`GF +${gfIncrement}, GA +${gaIncrement} applied to ${team.name}!`);
    setAddToGF(0);
    setAddToGA(0);

    const { data: refreshed } = await supabase
      .from("teams")
      .select("id, name, gf, ga")
      .eq("tournament_id", selectedTournamentId)
      .order("name");

    setTeams(refreshed || []);
  }

  const currentTournament = tournaments.find((t) => t.id === selectedTournamentId);

  return (
    <>
      {/* SESSION HEADER - This shows they are currently "logged in" to a tournament */}
      <div className="bg-dark  text-white py-2 px-4 d-flex justify-content-between align-items-center shadow-sm " style={{marginTop : '70px'}} >
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary">ACTIVE SESSION</span>
          <span className="fw-bold">{currentTournament?.name || "Loading..."}</span>
        </div>
        <button 
          onClick={handleExitTournament} 
          className="btn btn-sm btn-outline-danger"
          style={{ fontWeight: '600' }}
        >
          Exit Tournament
        </button>
      </div>

      <div className="container py-5">
        <Navbar />
        <ManagerPanel />
        <Match />

        <hr className="my-5" />

        {/* Tournament Selector – hidden when in locked/session mode */}
        {!activeSession && (
          <div className="mb-4">
            <label className="form-label fw-bold">Select Tournament</label>
            <select
              className="form-select"
              value={selectedTournamentId ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                setSelectedTournamentId(id);
                // Keep localStorage in sync
                if (id) {
                  localStorage.setItem("active_tournament", JSON.stringify({ id, name: "" }));
                } else {
                  localStorage.removeItem("active_tournament");
                }
              }}
            >
              <option value="">-- Choose Tournament --</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
              Adjusting goals for <strong>{currentTournament?.name}</strong>
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
                  <input type="number" className="form-control" value={addToGF} onChange={(e) => setAddToGF(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Add to GA</label>
                  <input type="number" className="form-control" value={addToGA} onChange={(e) => setAddToGA(e.target.value)} />
                </div>
                <button className="btn btn-success" onClick={addGoals}>Apply</button>
              </div>
            </div>

            <h3 className="mb-4">Live Goal Overview</h3>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Team</th>
                    <th className="text-center">GF</th>
                    <th className="text-center">GA</th>
                    <th className="text-center">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td className="text-center">{t.gf}</td>
                      <td className="text-center">{t.ga}</td>
                      <td className="text-center">{(t.gf || 0) - (t.ga || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MatchManager;