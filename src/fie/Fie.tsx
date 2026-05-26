import React, { useState } from "react";
import Header from "./Header";
import ClanRankingsTable from "./components/ClanRankingsTable";
import ClanPlayersTable from "./components/ClanPlayersTable";
import AllPlayersTable from "./components/AllPlayersTable";

export default function HelloWorld() {
  const [selected, setSelected] = useState("Alpha Warriors");

  const pageStyle = {
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(135deg, #38b222, #ff9f1c)",
    fontFamily: "Arial",
    color: "#111",
  };

  return (
    <>
      <Header />

      <div style={pageStyle}>
        {/* RANKINGS */}
        <ClanRankingsTable />

        {/* FILTER + PLAYERS */}
        <ClanPlayersTable selected={selected} setSelected={setSelected} />

        {/* ALL PLAYERS */}
        <AllPlayersTable />
      </div>
    </>
  );
}