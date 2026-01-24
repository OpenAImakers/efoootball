"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase"; // adjust path
import Navbar from "../components/Navbar"; // adjust path

interface Team {
  id: string;
  name: string;
  w: number;
  d: number;
  l: number;
  points: number;
  gd: number;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("teamsranked")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        setTeams(data || []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load league standings.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <main className="mt-5">
      <Navbar />

      <div className="container py-5">
        <div className="mb-4">
          <h1 className="h3 fw-bold">League Standings</h1>
          <p className="text-muted">E-Football Season 2026</p>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading teams...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center my-5">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Team Name</th>
                  <th scope="col" className="text-center">W</th>
                  <th scope="col" className="text-center">D</th>
                  <th scope="col" className="text-center">L</th>
                  <th scope="col" className="text-center">PTS</th>
                  <th scope="col" className="text-center">GD</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No teams found.
                    </td>
                  </tr>
                ) : (
                  teams.map((team) => (
                    <tr key={team.id}>
                      <td className="fw-medium">{team.name}</td>
                      <td className="text-center">{team.w}</td>
                      <td className="text-center">{team.d}</td>
                      <td className="text-center">{team.l}</td>
                      <td className="text-center fw-bold">{team.points}</td>
                      <td className="text-center">{team.gd}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}