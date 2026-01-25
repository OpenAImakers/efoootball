"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

interface Team {
  id: string;
  name: string;
  w: number;
  d: number;
  l: number;
  points: number;
  gd: number;
}

// Fixed: Moved outside the component so it has a stable reference.
// This prevents the ESLint 'missing dependency' error and infinite loops.
const ALL_TABLES = ["teamsranked", "teamgroup1", "teamgroup2", "teamgroup3", "teamgroup4"];

export default function Teams() {
  const [groups, setGroups] = useState<{ [key: string]: Team[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const fetchedData: { [key: string]: Team[] } = {};

        await Promise.all(
          ALL_TABLES.map(async (table) => {
            const { data, error } = await supabase
              .from(table)
              .select("*")
              .order("points", { ascending: false });

            if (error) throw error;
            fetchedData[table] = data || [];
          })
        );

        setGroups(fetchedData);
      } catch (err: any) {
        setError("Failed to load standings.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []); // Empty dependency array is now valid because ALL_TABLES is external

  return (
    <main className="mt-5 bg-black text-white min-vh-100">
      <Navbar />

      <div className="container py-5">
        <h1 className="h3 fw-bold text-primary mb-4">League Standings</h1>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          ALL_TABLES.map((table) => (
            <div key={table} className="mb-5">
              <h2 className="h5 fw-bold text-uppercase border-start border-primary border-4 ps-2 mb-3">
                {table === "teamsranked" ? "Overall Standings" : `Group ${table.slice(-1)}`}
              </h2>
              <div className="table-responsive">
                <table className="table table-dark table-bordered align-middle">
                  <thead className="table-primary text-black">
                    <tr>
                      <th>Team Name</th>
                      <th className="text-center">W</th>
                      <th className="text-center">D</th>
                      <th className="text-center">L</th>
                      <th className="text-center">PTS</th>
                      <th className="text-center">GD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups[table]?.map((team) => (
                      <tr key={team.id}>
                        <td>{team.name}</td>
                        <td className="text-center">{team.w}</td>
                        <td className="text-center">{team.d}</td>
                        <td className="text-center">{team.l}</td>
                        <td className="text-center fw-bold text-primary">{team.points}</td>
                        <td className="text-center">{team.gd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}