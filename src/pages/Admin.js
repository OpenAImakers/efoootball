import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Match from "./Matchfixer";
import ManagerPanel from "./ManagerPanel";

function MatchManager() {
  const [teams, setTeams] = useState([]);

  // ── Manual GF/GA update fields ──
  const [selectedTeam, setSelectedTeam] = useState("");
  const [addToGF, setAddToGF] = useState(0);
  const [addToGA, setAddToGA] = useState(0);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, gf, ga")
      .order("name");

    if (!error) setTeams(data || []);
  }

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

    // 1️⃣ Get current GF / GA
    const { data: team, error: fetchError } = await supabase
      .from("teams")
      .select("gf, ga")
      .eq("id", selectedTeam)
      .single();

    if (fetchError) {
      alert("Failed to fetch current team stats");
      return;
    }

    const newGF = (team.gf || 0) + gfIncrement;
    const newGA = (team.ga || 0) + gaIncrement;

    // 2️⃣ Update with incremented values
    const { error: updateError } = await supabase
      .from("teams")
      .update({
        gf: newGF,
        ga: newGA,
      })
      .eq("id", selectedTeam);

    if (updateError) {
      console.error(updateError);
      alert("Failed to update goals");
      return;
    }

    // 3️⃣ UI refresh
    alert(`GF +${gfIncrement}, GA +${gaIncrement} applied to ${team.name || 'team'}`);
    setAddToGF(0);
    setAddToGA(0);
    fetchTeams();
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px", fontFamily: "sans-serif" }}>
      <Navbar />
      <ManagerPanel/>
      
      {/* This is the separate component you created for Scheduling/Results */}
      <Match />

      <hr style={{ margin: "40px 0" }} />

      {/* ── Manual GF / GA section ── */}
      <h2>Manual Goal Adjustments (GF / GA)</h2>
      <p style={{ color: "gray" }}>Use this to manually override or fix team goal totals.</p>

      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      >
        <option value="">Select Team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} (Current GF: {t.gf || 0} | GA: {t.ga || 0})
          </option>
        ))}
      </select>

      <br /><br />

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <label>
          Add to GF:{" "}
          <input
            type="number"
            min="0"
            value={addToGF}
            onChange={(e) => setAddToGF(e.target.value)}
            style={{ width: "80px", padding: "5px" }}
          />
        </label>

        <label>
          Add to GA:{" "}
          <input
            type="number"
            min="0"
            value={addToGA}
            onChange={(e) => setAddToGA(e.target.value)}
            style={{ width: "80px", padding: "5px" }}
          />
        </label>

        <button 
          onClick={addGoals}
          style={{ padding: "6px 16px", cursor: "pointer", background: "#f0f0f0" }}
        >
          Apply Adjustment
        </button>
      </div>

      {/* Overview Table */}
      <h3 style={{ marginTop: "40px" }}>Live Goal Overview</h3>
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th>Team</th>
            <th>Goals For (GF)</th>
            <th>Goals Against (GA)</th>
            <th>Difference (GD)</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id}>
              <td><strong>{t.name}</strong></td>
              <td>{t.gf || 0}</td>
              <td>{t.ga || 0}</td>
              <td>{(t.gf || 0) - (t.ga || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MatchManager;