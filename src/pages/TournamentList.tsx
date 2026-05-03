import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import { loginToTournament } from "../Utils/TournamentSession";

interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
  passkey: string;
  tournament_avatar: string;
  status: string; // Added status to interface
}

const CACHE_KEY = "tournaments_cache";
const CACHE_EXPIRY = 5 * 60 * 1000; 

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [inputPasskey, setInputPasskey] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
      if (!isExpired) {
        // Double check cache doesn't contain 'finished' just in case
        setTournaments(data.filter((t: Tournament) => t.status !== "finished"));
        setLoading(false);
        return;
      }
    }

    // DB Check: Strictly fetch only those where status is 'live'
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "live"); 

    if (!error && data) {
      setTournaments(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    }
    setLoading(false);
  };

  const handleJoin = () => {
    if (!selectedTournament) return;
    if (inputPasskey !== selectedTournament.passkey) {
      alert("Incorrect Passkey. Access Denied.");
      return;
    }
    setVerifying(true);
    loginToTournament(selectedTournament.id, selectedTournament.name);
    setSelectedTournament(null);
    setInputPasskey("");
    window.location.href = "/admin";
  };

  // Filter by search AND ensure status is still not finished (redundant but safe)
  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) && t.status !== "finished"
  );

  return (
    <>
      <Navbar />
      <div style={{ 
        width: '100%', 
        paddingTop: '100px', 
        boxSizing: 'border-box' 
      }}>
        
        <div style={{ maxWidth: '100%', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: 'bold' }}>Find a Tournament</h2>

          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
                width: '100%', 
                padding: '12px', 
                marginBottom: '20px', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                fontSize: '16px',
                boxSizing: 'border-box' 
            }}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px', width: '100%' }}>
              {filtered.map(t => (
                <div key={t.id} style={{
                  padding: '20px',
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img 
                      src={t.tournament_avatar || 'https://via.placeholder.com/50'} 
                      alt="Tournament" 
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>{t.name}</h3>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <small style={{ color: '#666', textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>
                          Type: {t.tournament_type?.replace('_', ' ')}
                        </small>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' }}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTournament(t)}
                    style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Manage
                  </button>
                </div>
              ))}
              {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No live tournaments found.</p>}
            </div>
          )}
        </div>

        {/* Modal Overlay remains same */}
        {selectedTournament && (
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
                Enter passkey for <br /><strong>{selectedTournament.name}</strong>
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
                  textAlign: 'center', fontSize: '18px', letterSpacing: '4px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleJoin}
                  disabled={verifying}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.7 : 1 }}
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={() => { setSelectedTournament(null); setInputPasskey(""); }}
                  disabled={verifying}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: verifying ? 'not-allowed' : 'pointer' }}
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

export default TournamentList;