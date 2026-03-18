import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import LeaguesNavbar from "./Leaguenav";

export default function AddLeague() {
  const navigate = useNavigate();

  const [leagueData, setLeagueData] = useState({
    name: "",
    organizer: "",
    passkey: "",
    rules: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeagueData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueData.name || !leagueData.organizer) {
      return alert("League Name and Organizer are required");
    }

    // Replace with actual user ID
    const created_by = "54027c85-0e61-403e-8b39-20ff7a457643";

    const { data, error } = await supabase
      .from("leagues")
      .insert([{ ...leagueData, created_by }])
      .select()
      .single();

    if (error) return alert("Error creating league: " + error.message);

    // Redirect to the league landing page
    navigate(`/specificleague/${data.id}`);
  };

  return (
    <div className="min-vh-100 bg-white">
      <LeaguesNavbar />

      <div className="container px-4 py-4">
        <h3 className="fw-bold mb-4">Add New League</h3>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">League Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={leagueData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Organizer *</label>
            <input
              type="text"
              name="organizer"
              className="form-control"
              value={leagueData.organizer}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Passkey </label>
            <input
              type="text"
              name="passkey"
              className="form-control"
              value={leagueData.passkey}
              onChange={handleChange}
            />
          </div>

         

          <button type="submit" className="btn btn-primary">
            Create League
          </button>

        </form>
      </div>
    </div>
  );
}