import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import LeaguesNavbar from "./Leaguenav";

export default function Leagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    const { data, error } = await supabase
      .from("leagues")
      .select("id, name, organizer");

    if (error) {
      console.error(error);
    } else {
      setLeagues(data);
    }
  };

  return (
    <div className="min-vh-100 bg-white">

      <LeaguesNavbar />

      <div className="container mt-4">

        <table className="table table-bordered">

          <thead>
            <tr>
              <th>League</th>
              <th>Organizer</th>
            </tr>
          </thead>

          <tbody>

            {leagues.map((league) => (
              <tr
                key={league.id}
                onClick={() => navigate(`/league/${league.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{league.name}</td>
                <td>{league.organizer || "N/A"}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}