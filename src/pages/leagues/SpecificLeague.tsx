import React from "react";
import LeaguesNavbar from "./Leaguenav";


export default function SpecificLeague() {



  const players = [
    {pos:1, name:"DENNY SANDE"},
    {pos:2, name:"WENDYCUTIE"},
    {pos:3, name:"DIEZ10"},
    {pos:4, name:"TIKITAKA"},
    {pos:5, name:"CALMCHAOS"},
    {pos:6, name:"MACHAPO"},
    {pos:7, name:"SAYMYNAMEBABY"},
    {pos:8, name:"ELSAO"},
    {pos:9, name:"YACINE"},
    {pos:10, name:"ISACK SKYLA"}
  ];

  const goats = [
    {name:"DENNY SANDE", titles:5, era:"2023 - Present"},
    {name:"WENDYCUTIE", titles:3, era:"2024 - Present"},
    {name:"DIEZ10", titles:4, era:"2022 - 2025"}
  ];

  return (
    <div className="min-vh-100 w-100 bg-white d-flex flex-column">

      {/* Navbar */}
      <LeaguesNavbar />

      <div className="container-fluid px-4 py-4">

        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">Nairobi Premier League</h3>
            <small className="text-muted">League Archive</small>
          </div>
        </div>


        {/* League Information */}
        <table className="table table-bordered align-middle">

          <tbody>

            <tr>
              <th style={{width:"30%"}}>Organizer</th>
              <td>City Stars Gaming</td>
            </tr>

            <tr>
              <th>League Position</th>
              <td>3</td>
            </tr>

            <tr>
              <th>Total Players</th>
              <td>124</td>
            </tr>

            <tr>
              <th>Cups Played</th>
              <td>12</td>
            </tr>

            <tr>
              <th>Sponsors</th>
              <td>Safaricom, Red Bull</td>
            </tr>

            <tr>
              <th>League Since</th>
              <td>2022</td>
            </tr>

            <tr>
              <th>Total Matches Played</th>
              <td>1402</td>
            </tr>

          </tbody>

        </table>


        {/* Tournament Archive */}
        <h5 className="mt-5 mb-3 fw-bold">
          Tournament History
        </h5>

        <table className="table table-hover table-bordered align-middle">

          <thead className="table-dark">

            <tr>
              <th>Tournament</th>
              <th>Season</th>
              <th>Winner</th>
              <th>Players</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td>Kanairo Champions Cup</td>
              <td>2025</td>
              <td>DENNY SANDE</td>
              <td>32</td>
              <td><span className="badge bg-success">Completed</span></td>
            </tr>

            <tr>
              <td>Eastlands Knockout</td>
              <td>2025</td>
              <td>WENDYCUTIE</td>
              <td>16</td>
              <td><span className="badge bg-success">Completed</span></td>
            </tr>

            <tr>
              <td>Super 8 League</td>
              <td>2026</td>
              <td>-</td>
              <td>8</td>
              <td><span className="badge bg-warning text-dark">Ongoing</span></td>
            </tr>

          </tbody>

        </table>


        {/* Players Leaderboard */}
        <h5 className="mt-5 mb-3 fw-bold">
          Top Players Leaderboard
        </h5>

        <table className="table table-bordered align-middle">

          <thead className="table-light">
            <tr>
              <th style={{width:"10%"}}>Position</th>
              <th>Player</th>
            </tr>
          </thead>

          <tbody>

            {players.map((p) => (
              <tr key={p.pos}>
                <td className="fw-bold">{p.pos}</td>
                <td>{p.name}</td>
              </tr>
            ))}

          </tbody>

        </table>


        {/* Masters Corner */}
        <h5 className="mt-5 mb-3 fw-bold text-warning">
          🐐 Masters Corner
        </h5>

        <table className="table table-bordered align-middle">

          <thead className="table-dark">
            <tr>
              <th>Legend</th>
              <th>Titles</th>
              <th>Era</th>
            </tr>
          </thead>

          <tbody>

            {goats.map((g,i) => (
              <tr key={i}>
                <td className="fw-bold">{g.name}</td>
                <td>{g.titles}</td>
                <td>{g.era}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

      <style>{`

        table{
          font-size:0.95rem;
        }

        th{
          font-weight:600;
        }

      `}</style>

    </div>
  );
}