import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";

export default function SpecificLeague() {
  const { id } = useParams();

  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagueData();
  }, [id]);

  const fetchLeagueData = async () => {
    setLoading(true);

    // 1. Fetch league
    const { data: leagueData, error: leagueError } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", id)
      .single();

    // 2. Fetch teams in this league
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("league_id", id);

    if (leagueError) console.error(leagueError);
    if (teamsError) console.error(teamsError);

    setLeague(leagueData);
    setTeams(teamsData || []);
    setLoading(false);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  if (!league) return <div className="p-4">League not found</div>;

  return (
    <div className="min-vh-100 w-100 bg-white d-flex flex-column">

      <LeaguesNavbar />

      <div className="container-fluid px-4 py-4">

        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">{league.name}</h3>
            <small className="text-muted">League Overview</small>
          </div>
        </div>

        {/* League Info */}
        <table className="table table-bordered align-middle">
          <tbody>

            <tr>
              <th style={{width:"30%"}}>Organizer</th>
              <td>{league.organizer || "N/A"}</td>
            </tr>

            <tr>
              <th>Total Teams</th>
              <td>{teams.length}</td>
            </tr>

          </tbody>
        </table>

        {/* Teams Table */}
        <h5 className="mt-5 mb-3 fw-bold">
          Teams
        </h5>

        <table className="table table-bordered align-middle">

          <thead className="table-light">
            <tr>
              <th style={{width:"10%"}}>#</th>
              <th>Team Name</th>
            </tr>
          </thead>

<tbody>
  {teams.length === 0 ? (
    <tr>
      <td colSpan={2} className="text-center">
        No teams found
      </td>
    </tr>
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

      </div>
    </div>
  );
}
