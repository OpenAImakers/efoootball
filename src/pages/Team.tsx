"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import MatchesTimer from "./MatchesTimer";

interface Team {
  id: number;
  name: string;
  rank: number;
  w: number;
  d: number;
  l: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
  group_id?: number | null;
}

const target = new Date("2026-01-02T16:00:00").getTime();

const SOURCES = [
  { key: "tournament_two_view", label: "Kenya Efootball Knockouts" },
  { key: "teamsranked", label: "Friendly Matches" },
];

export default function Teams() {
  const [selectedSource, setSelectedSource] = useState<string>("tournament_two_view"); // default = Kenya Efootball
  const [standings, setStandings] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from(selectedSource)
          .select("rank, id, name, w, d, l, points, gf, ga, gd")
          .order("rank", { ascending: true });

        if (fetchError) throw fetchError;

        setStandings(data || []);
      } catch (err: any) {
        setError("Failed to load standings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedSource]);

  return (
    <main className="mt-5 bg-black  text-white min-vh-100">
      <Navbar />

      <div className="py-5">
        {/* View Selector */}
        <div className="mb-4">
          <select
            className="form-select bg-dark text-white border border-primary"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            {SOURCES.map((source) => (
              <option key={source.key} value={source.key}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <MatchesTimer targetTime={target} />

        <div className="mt-4">
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : error ? (
            <div className="alert alert-danger bg-dark border-danger text-center">
              {error}
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No teams found in this view.
            </div>
          ) : (
            <div className="bg-dark border border-primary rounded overflow-hidden">
              <div className="p-3 fw-bold text-uppercase border-bottom border-primary">
                {SOURCES.find((s) => s.key === selectedSource)?.label || "Standings"}
              </div>

              <div className="table-responsive">
                <table className="table table-dark mb-0 align-middle table-hover">
                  <thead className="table-primary text-dark">
                    <tr>
                      <th className="text-center">Rank</th>
                      <th>Team</th>
                      <th className="text-center">W</th>
                      <th className="text-center">D</th>
                      <th className="text-center">L</th>
                      <th className="text-center">PTS</th>
                      <th className="text-center">GF</th>
                      <th className="text-center">GA</th>
                      <th className="text-center">GD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team) => (
                      <tr key={team.id}>
                        <td className="text-center fw-bold">{team.rank}</td>
                        <td>{team.name}</td>
                        <td className="text-center">{team.w}</td>
                        <td className="text-center">{team.d}</td>
                        <td className="text-center">{team.l}</td>
                        <td className="text-center fw-bold text-warning">{team.points}</td>
                        <td className="text-center">{team.gf}</td>
                        <td className="text-center">{team.ga}</td>
                        <td className="text-center">{team.gd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}