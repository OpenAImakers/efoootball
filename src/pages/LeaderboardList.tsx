import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import { loginToLeaderboard } from "../Utils/LeaderboardSession"; // ← our helper

interface Leaderboard {
  id: string;           // UUID
  name: string;
  passkey: string;
  created_by: string;   // user UUID
}

const LeaderboardList: React.FC = () => {
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<Leaderboard | null>(null);
  const [inputPasskey, setInputPasskey] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    const { data, error } = await supabase.from("leaderboard").select("*");
    if (!error) setLeaderboards(data || []);
    setLoading(false);
  };

  const handleJoin = () => {
    if (!selectedLeaderboard) return;

    if (inputPasskey !== selectedLeaderboard.passkey) {
      alert("Incorrect Passkey. Access Denied.");
      return;
    }

    setVerifying(true);

    // 1. Save the session to localStorage
    loginToLeaderboard(selectedLeaderboard.id, selectedLeaderboard.name);

    // 2. Clean up local state
    setSelectedLeaderboard(null);
    setInputPasskey("");

    // 3. Redirect or reload app state
    window.location.href = "/admin"; 
  };

  const filtered = leaderboards.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px', marginTop: "100px", maxWidth: '800px', margin: '100px auto 0 auto' }}>
        <h2 style={{ marginBottom: '20px', fontWeight: 'bold' }}>Find a Leaderboard</h2>

        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {filtered.map(l => (
              <div key={l.id} style={{
                padding: '20px',
                border: '1px solid #eee',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{l.name}</h3>
                  <small style={{ color: '#666', textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>
                    Created By: {l.created_by.substring(0, 8)}...
                  </small>
                </div>
                <button
                  onClick={() => setSelectedLeaderboard(l)}
                  style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Passkey Modal */}
        {selectedLeaderboard && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white', padding: '30px', borderRadius: '16px',
              textAlign: 'center', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: '10px' }}>Admin Access</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Enter passkey for <br /><strong>{selectedLeaderboard.name}</strong>
              </p>
              <input
                type="password"
                placeholder="Passkey"
                autoFocus
                value={inputPasskey}
                onChange={(e) => setInputPasskey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                style={{
                  width: '100%', padding: '12px', marginBottom: '20px',
                  borderRadius: '8px', border: '1px solid #ccc',
                  textAlign: 'center', fontSize: '18px', letterSpacing: '4px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleJoin}
                  disabled={verifying}
                  style={{
                    flex: 1, padding: '12px', backgroundColor: '#10b981',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', cursor: verifying ? 'not-allowed' : 'pointer',
                    opacity: verifying ? 0.7 : 1
                  }}
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={() => {
                    setSelectedLeaderboard(null);
                    setInputPasskey("");
                  }}
                  disabled={verifying}
                  style={{
                    flex: 1, padding: '12px', backgroundColor: '#f3f4f6',
                    color: '#374151', border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', cursor: verifying ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LeaderboardList;