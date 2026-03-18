import React, { useEffect, useState } from "react";
import { getActiveLeague, logoutFromLeague } from "../../Utils/LeagueSesssion";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import LeaguesNavbar from "./Leaguenav";
export default function LeagueManagement() {
  const navigate = useNavigate();
  const activeLeague = getActiveLeague();

  const [leagueData, setLeagueData] = useState({
    name: "",
    organizer: "",
    passkey: "",
    rules: ""
  });

useEffect(() => {
  if (!activeLeague) {
    navigate("/leaguelandingpage");
    return;
  }
  fetchLeague(activeLeague.id);
}, [activeLeague, navigate]); 

  const fetchLeague = async (id: string) => {
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return console.error(error);

    setLeagueData({
      name: data.name,
      organizer: data.organizer,
      passkey: data.passkey || "",
      rules: data.rules || ""
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeagueData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("leagues")
      .update(leagueData)
      .eq("id", activeLeague.id);

    if (error) return alert("Error saving league: " + error.message);
    alert("League updated successfully!");
  };

  if (!activeLeague) return null;

  return (
   <>
        <LeaguesNavbar />
         <div className="container mt-4">
      <h3 className="mb-3">Manage League: {activeLeague.name}</h3>

      <div className="mb-3">
        <label className="form-label">League Name</label>
        <input
          type="text"
          className="form-control"
          name="name"
          value={leagueData.name}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Organizer</label>
        <input
          type="text"
          className="form-control"
          name="organizer"
          value={leagueData.organizer}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Passkey</label>
        <input
          type="text"
          className="form-control"
          name="passkey"
          value={leagueData.passkey}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Rules / Notes</label>
        <textarea
          className="form-control"
          name="rules"
          value={leagueData.rules}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <button className="btn btn-primary me-2" onClick={handleSave}>
        Save League
      </button>

      <button className="btn btn-danger" onClick={logoutFromLeague}>
        Logout
      </button>
    </div>
    </>
  );
}