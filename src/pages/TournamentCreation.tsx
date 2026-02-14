import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginToTournament } from "../Utils/TournamentSession"; // ← import this

export default function CreateTournament() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tournamentType, setTournamentType] = useState("single_elimination");
  const [startTime, setStartTime] = useState("");
  const [passkey, setPasskey] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Basic Validation
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      setErrorMsg("End time must be after the start time.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("tournaments")
      .insert([
        {
          name: name.trim(),
          tournament_type: tournamentType,
          start_time: startTime || null,
          end_time: endTime || null,
          is_active: isActive,
          created_by: user?.id,
          passkey: passkey.trim() || null, // optional passkey
        },
      ])
      .select()
      .single(); // ← .single() so data is the new row, not array

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      // Automatically log in to the new tournament (set active session)
      loginToTournament(data.id, data.name);

      // Navigate to tournament list — now in management mode for this one
      navigate("/tournament-list");
    }

    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px'
  };

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "65px", margin: '40px auto', padding: '30px', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Setup Tournament</h2>

        {errorMsg && (
          <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tournament Name</label>
            <input
              type="text"
              placeholder="e.g. Moha Gamers Zone"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tournament Passkey (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 1234"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Tournament Type Dropdown */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Format Type</label>
            <select 
              value={tournamentType} 
              onChange={(e) => setTournamentType(e.target.value)}
              style={inputStyle}
            >
              <option value="single_elimination">Single Elimination (Knockout)</option>
              <option value="round_robin_single">Round Robin (Single)</option>
              <option value="round_robin_double">Round Robin (Double)</option>
              <option value="double_elimination">Double Elimination</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Starts</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Ends</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Set tournament to live immediately
          </label>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? "Saving..." : "Create Tournament"}
          </button>
        </form>
      </div>
    </>
  );
}