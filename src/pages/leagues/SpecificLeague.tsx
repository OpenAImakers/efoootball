import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";

export default function SpecificLeague() {
  const { id } = useParams();

  const [league, setLeague] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeagueData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    // 1. Fetch league
    const { data: leagueData, error: leagueError } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", id)
      .single();

    if (leagueError) console.error(leagueError);

    // 2. Fetch teams in this league
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("league_id", id);

    if (teamsError) console.error(teamsError);

    // 3. Fetch tournaments linked to this league
    const { data: tournamentsData, error: tournamentsError } = await supabase
      .from("tournaments")
      .select("id, name, start_time, end_time, tournament_type")
      .eq("league_id", id)
      .order("created_at", { ascending: true });

    if (tournamentsError) console.error(tournamentsError);

    setLeague(leagueData);
    setTeams(teamsData || []);
    setTournaments(tournamentsData || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!league) return <div className="p-4">League not found</div>;

  return (
    <div className="min-vh-100 w-100 bg-white d-flex flex-column">
      <LeaguesNavbar />
      <div className="container-fluid px-4 py-4">
        <div className="d-flex align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">{league.name}</h3>
            <small className="text-muted">League Overview</small>
          </div>
        </div>

        <table className="table table-bordered align-middle">
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>Organizer</th>
              <td>{league.organizer || "N/A"}</td>
            </tr>
            <tr>
              <th>Total Teams</th>
              <td>{teams.length}</td>
            </tr>
            <tr>
              <th>Total Tournaments</th>
              <td>{tournaments.length}</td>
            </tr>
          </tbody>
        </table>

        <h5 className="mt-5 mb-3 fw-bold">Teams</h5>
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: "10%" }}>#</th>
              <th>Team Name</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr><td colSpan={2} className="text-center">No teams found</td></tr>
            ) : (
              teams.map((team, index) => (
                <tr key={team.id}>
                  <td className="fw-bold">{index + 1}</td>
                  <td>{team.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h5 className="mt-5 mb-3 fw-bold">Tournaments</h5>
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.length === 0 ? (
              <tr><td colSpan={5} className="text-center">No tournaments found</td></tr>
            ) : (
              tournaments.map((tournament, index) => (
                <tr key={tournament.id}>
                  <td className="fw-bold">{index + 1}</td>
                  <td>{tournament.name}</td>
                  <td>{tournament.tournament_type}</td>
                  <td>{tournament.start_time ? new Date(tournament.start_time).toLocaleString() : "N/A"}</td>
                  <td>{tournament.end_time ? new Date(tournament.end_time).toLocaleString() : "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}