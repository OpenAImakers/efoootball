import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginToLeaderboard } from "../Utils/LeaderboardSession"; // ← our helper

export default function CreateLeaderboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [passkey, setPasskey] = useState("");
  const [isActive, setIsActive] = useState(false); // optional if you want live leaderboard
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("You must be logged in to create a leaderboard.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("leaderboard")
      .insert([
        {
          name: name.trim(),
          passkey: passkey.trim() || null,
          created_by: user.id,
          is_active: isActive // optional field
        },
      ])
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      // Automatically log in to the new leaderboard
      loginToLeaderboard(data.id, data.name);

      // Navigate to leaderboard list — now in management mode
      navigate("/leaderboard-list");
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
      <div style={{ marginTop: "65px", margin: '40px auto', padding: '30px', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create Leaderboard</h2>

        {errorMsg && (
          <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Leaderboard Name</label>
            <input
              type="text"
              placeholder="e.g. Top Traders 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Passkey (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 1234"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              style={inputStyle}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Set leaderboard to live immediately
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
            {loading ? "Creating..." : "Create Leaderboard"}
          </button>
        </form>
      </div>
    </>
  );
}