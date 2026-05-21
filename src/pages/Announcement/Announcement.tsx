import React from "react";

export default function RankingsAnnouncement() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071426", // deep dark blue
        color: "#ffffff",
      }}
    >
      {/* Hero */}
      <section
        className="position-relative"
        style={{
          height: "420px",
          backgroundImage:
           "url('/kicc.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="position-absolute w-100 h-100"
          style={{
            background:
              "linear-gradient(to bottom, rgba(7,20,38,0.4), rgba(7,20,38,0.95))",
          }}
        />

        <div className="container position-relative h-100">
          <div className="d-flex flex-column justify-content-center h-100">
            
            {/* Sticky Header */}
            <div
              className="fw-bold text-uppercase"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10000,
                letterSpacing: "2px",
                color: "#4da3ff", // soft esports blue
                padding: "10px 0",
              }}
            >
              Kenya eFootball Rankings
            </div>

            <h1
              className="display-3 fw-bold mb-3"
              style={{
                maxWidth: "900px",
                color: "#ffffff",
                textShadow: "0 4px 20px rgba(0,0,0,0.6)",
              }}
            >
              End Of Season Rankings Released
            </h1>

            <p
              className="lead"
              style={{
                maxWidth: "700px",
                color: "#cfe6ff", // soft blue-white
              }}
            >
              The following are our Top 10 Leaderboard players for this season
            </p>
          </div>
        </div>
      </section>

      {/* Announcement */}
      <div className="container py-5">
        <div className="mb-5">
          <h2 className="fw-bold" style={{ color: "#ffffff" }}>
            Top 10 Qualified Players
          </h2>

          <p style={{ color: "#9bb9d4" }}>
            Season 1 : 2026
          </p>
        </div>

        {/* Table */}
        <div
  className="table-responsive rounded-4 overflow-hidden"
  style={{
    border: "1px solid rgba(77,163,255,0.18)",
    background: "rgba(77,163,255,0.03)", // subtle blue surface
    backdropFilter: "blur(8px)",
  }}
>
  <table
    className="table align-middle mb-0"
    style={{
      color: "#eaf2ff",
      background: "#0b1f3a", // lifted panel (NOT pure black)
    }}
  >
    <thead
      style={{
        background: "#102a4a", // clearer header separation
        color: "#4da3ff",
      }}
    >
      <tr>
        <th>Rank</th>
        <th>Player</th>
        <th>County</th>
        <th>Points</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td
          colSpan={5}
          className="text-center py-5"
          style={{
            color: "#9bb9d4",
            background: "#0b1f3a",
          }}
        >
          No qualified players yet.
          <br />
          <span style={{ color: "#4da3ff" }}>
            Keep checking this page for updates.
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>

        {/* Footer Box */}
        <div
          className="mt-5 p-4 rounded-4"
          style={{
            background: "rgba(77,163,255,0.05)",
            border: "1px solid rgba(77,163,255,0.15)",
          }}
        >
          <h5 className="fw-bold mb-3" style={{ color: "#ffffff" }}>
            Official Announcement
          </h5>

          <p style={{ color: "#cfe6ff", marginBottom: 0 }}>
            The Kenya eFootball Rankings hosts two seasons per year, with
            players earning points through tournament and league participation.
            At the conclusion of each season, the top 10 Leaderboard ranked
            competitors qualify for the Regional Championship Finals hosted in a
            selected Kenyan city. Qualified players will compete in a week-long
            championship event featuring official fixtures, live competition,
            player recognition, and championship prizes. Venue details,
            schedules, and participation information will be communicated to all
            qualified players prior to the commencement of the finals.
          </p>
        </div>
      </div>
    </div>
  );
}