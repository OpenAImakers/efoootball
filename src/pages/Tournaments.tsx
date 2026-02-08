"use client";

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabase';

interface Tournament {
  id: number;
  name: string;
  created_at: string;
}

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select('id, name, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTournaments(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();

    const channel = supabase
      .channel('tournaments-db')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tournaments' },
        (payload) => {
          setTournaments((prev) => [payload.new as Tournament, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container py-4">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-5 text-muted">
          No tournaments found.
        </div>
      ) : (
        <div className="list-group">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
            >
              <div>
                <div className="fw-bold">{t.name}</div>
                <small className="text-muted">
                  #{t.id} • {new Date(t.created_at).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentList;