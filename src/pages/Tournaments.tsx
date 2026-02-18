"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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
      background: '#020617', 
      minHeight: '100vh', 
      padding: '60px 20px',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header & Search */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '900', 
            letterSpacing: '-1px',
            marginBottom: '10px',
            background: 'linear-gradient(to right, #38bdf8, #818cf8)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            TOURNAMENTS
          </h1>
          <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '30px' }}>Select an arena and dominate the field.</p>
          
          <input 
            type="text" 
            placeholder="Search arenas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '16px 24px',
              borderRadius: '100px',
              border: '2px solid #1e293b',
              backgroundColor: '#0f172a',
              color: 'white',
              width: '100%',
              maxWidth: '500px',
              outline: 'none',
              fontSize: '16px',
              transition: 'border-color 0.3s'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
            <div className="spinner-border text-info" role="status"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px dashed #334155' }}>
            <p style={{ color: '#94a3b8' }}>No tournaments active at the moment.</p>
          </div>
        ) : (
          /* Poster Grid - increased minmax for larger cards */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '40px' 
          }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                style={{
                  backgroundColor: '#0f172a',
                  borderRadius: '24px',
                  height: '450px', // Tall Poster Height
                  border: '1px solid #1e293b',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Visual Background Element (The "Poster" Art) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at 50% 0%, ${t.is_active ? '#0d9488' : '#312e81'} 0%, transparent 70%)`,
                  opacity: 0.4
                }} />

                {/* Status Badge */}
                <div style={{ 
                  position: 'absolute', top: '24px', right: '24px',
                  padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '800',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  backgroundColor: t.is_active ? '#14b8a6' : '#334155',
                  color: 'white',
                  zIndex: 2
                }}>
                  {t.is_active ? 'ACTIVE' : 'ARCHIVED'}
                </div>

                {/* Poster Content Area */}
                <div style={{ 
                  padding: '32px', 
                  background: 'linear-gradient(to top, #0f172a 20%, transparent 100%)',
                  zIndex: 2,
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: '#38bdf8', 
                    letterSpacing: '2px',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    {t.tournament_type?.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  <h3 style={{ 
                    fontSize: '28px', 
                    fontWeight: '800', 
                    marginBottom: '16px', 
                    color: '#f1f5f9',
                    lineHeight: '1.1' 
                  }}>
                    {t.name.toUpperCase()}
                  </h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                      Est. {new Date(t.created_at).getFullYear()}
                    </span>
                    <div style={{ width: '40px', height: '2px', background: '#334155' }} />
                  </div>
                </div>

                {/* Decorative Side Text */}
                <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '100px',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    color: 'rgba(255,255,255,0.03)',
                    fontSize: '40px',
                    fontWeight: '900',
                    pointerEvents: 'none'
                }}>
                    TOURNAMENT
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList;