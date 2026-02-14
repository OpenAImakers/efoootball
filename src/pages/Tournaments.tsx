"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

interface Tournament {
  id: number;
  name: string;
  created_at: string;
  tournament_type: string;
  is_active: boolean;
}

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();

    const channel = supabase
      .channel('tournaments-db')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournaments' }, 
      (payload) => {
        setTournaments((prev) => [payload.new as Tournament, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, created_at, tournament_type, is_active')
      .order('created_at', { ascending: false });

    if (!error) setTournaments(data || []);
    setLoading(false);
  };

  const filtered = tournaments.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
      minHeight: '100vh', 
      padding: '40px 20px',
      color: '#f8fafc'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Active Arenas
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Join a tournament and start competing.</p>
          </div>
          
          <input 
            type="text" 
            placeholder="Search tournaments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: 'white',
              width: '100%',
              maxWidth: '300px',
              outline: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <div className="spinner-border text-info" role="status"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px dashed #334155' }}>
            <p style={{ color: '#94a3b8' }}>No tournaments found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #334155',
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = '#38bdf8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#334155';
                }}
                onClick={() => navigate(`/tournament/${t.id}`)}
              >
                {/* Status Badge */}
                <div style={{ 
                  position: 'absolute', top: '15px', right: '15px',
                  padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  backgroundColor: t.is_active ? '#065f46' : '#374151',
                  color: t.is_active ? '#34d399' : '#94a3b8'
                }}>
                  {t.is_active ? '● Live' : 'Closed'}
                </div>

                <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#f1f5f9' }}>{t.name}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    FORMAT: <span style={{ color: '#cbd5e1' }}>{t.tournament_type?.replace('_', ' ').toUpperCase()}</span>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    CREATED: <span style={{ color: '#cbd5e1' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <button style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: '700',
                  transition: 'background 0.2s'
                }}>
                  ENTER ARENA
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList;