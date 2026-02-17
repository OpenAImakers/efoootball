"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import RoundRobinLayout from "../TournamentView/RobinRound";
import SingleEliminationLayout from "../TournamentView/SingleElimination";
import DoubleEliminationLayout from "../TournamentView/DoubleElimination";

export interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
}

export interface Team {
  id: number;
  name: string;
  w: number;
  l: number;
  d: number;
  ga: number | null;
  gf: number | null;
  group_id: number | null;
  tournament_id: number;
}

export default function Teams() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]); // Added teams state
  const [loading, setLoading] = useState(true);

  // 1. Fetch all tournaments on mount
  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase.from("tournaments").select("id, name, tournament_type");
      if (data && data.length > 0) {
        setTournaments(data);
        setSelectedTournament(data[0]);
      }
    };
    fetchTournaments();
  }, []);

  // 2. Fetch teams whenever the selected tournament changes
  useEffect(() => {
    if (!selectedTournament) return;

    const fetchTeams = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, w, l, d, ga, gf, group_id, tournament_id")
        .eq("tournament_id", selectedTournament.id); // Filter by the active tournament

      if (!error && data) {
        setTeams(data);
      } else {
        setTeams([]);
      }
      setLoading(false);
    };

    fetchTeams();
  }, [selectedTournament]);

  const renderLayout = () => {
    if (!selectedTournament) return null;

    // We now pass both the tournament AND the filtered teams
    const props = { tournament: selectedTournament, teams: teams };

    switch (selectedTournament.tournament_type) {
      case "round_robin_single":
      case "round_robin_double":
        return <RoundRobinLayout {...props} />;
      case "single_elimination":
        return <SingleEliminationLayout {...props} />;
      case "double_elimination":
        return <DoubleEliminationLayout {...props} />;
      default:
        return (
          <div className="text-center py-5">
            <p className="text-muted">Unsupported tournament type: {selectedTournament.tournament_type}</p>
          </div>
        );
    }
  };

  return (
    <main className="mt-5 bg-black text-white min-vh-100">
      <Navbar />
      <div className="container-fluid py-5">
        <div className="mb-4 text-center">
          <label className="d-block small text-uppercase text-muted mb-2 tracking-widest">
            Select Tournament
          </label>
          <select
            className="form-select gaming-select mx-auto"
            style={{ maxWidth: "450px" }}
            value={selectedTournament?.id}
            onChange={(e) => {
              const t = tournaments.find((x) => x.id === parseInt(e.target.value));
              if (t) setSelectedTournament(t);
            }}
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          renderLayout()
        )}
      </div>

      <style>{`
        .gaming-select {
          background: #111 !important;
          color: #0d6efd !important;
          border: 2px solid #0d6efd !important;
          border-radius: 10px;
          font-weight: bold;
          padding: 12px;
          box-shadow: 0 0 15px rgba(13, 110, 253, 0.2);
        }
      `}</style>
    </main>
  );
}