import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Matches from "./Matches"; 
import Tournaments from "./Tournaments";
import CommunityFeed from "./CommunityFeed"; 

function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tournaments'); // Default to ONGOING

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <>
      <Navbar />

      <div className="container-fluid" style={{ marginTop: '5rem' }}>
        {/* Secondary Navbar (Sticky Tabs) */}
        <ul
          className="nav nav-pills nav-fill p-1 shadow-lg"
          style={{
            position: "sticky",
            top: "64px",
            zIndex: 999,
            backgroundColor: "rgba(30, 30, 30, 0.85)",
            backdropFilter: "blur(10px)",
            borderRadius: "0 0 16px 16px",
            borderBottom: "1px solid #333",
          }}
        >
          {/* ONGOING Tab */}
          <li className="nav-item">
            <button
              className={`nav-link py-2 fw-bold transition-all ${
                activeTab === "tournaments" ? "active" : "text-secondary"
              }`}
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.5px",
                backgroundColor: activeTab === "tournaments" ? "#28a745" : "transparent", // Green for ongoing
                color: activeTab === "tournaments" ? "#fff" : "#bbb",
                border: "none",
                borderRadius: "10px",
                transition: "all 0.3s ease",
              }}
              onClick={() => setActiveTab("tournaments")}
            >
              ONGOING
            </button>
          </li>

          {/* Matches Tab */}
          <li className="nav-item">
            <button
              className={`nav-link py-2 fw-bold transition-all ${
                activeTab === "matches" ? "active" : "text-secondary"
              }`}
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.5px",
                backgroundColor: activeTab === "matches" ? "#FFA500" : "transparent",
                color: activeTab === "matches" ? "#000" : "#bbb",
                border: "none",
                borderRadius: "10px",
                transition: "all 0.3s ease",
              }}
              onClick={() => setActiveTab("matches")}
            >
              Matches
            </button>
          </li>

          {/* Feed Tab */}
          <li className="nav-item">
            <button
              className={`nav-link py-2 fw-bold transition-all ${
                activeTab === "discussion" ? "active" : "text-secondary"
              }`}
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.5px",
                backgroundColor: activeTab === "discussion" ? "#FFA500" : "transparent",
                color: activeTab === "discussion" ? "#000" : "#bbb",
                border: "none",
                borderRadius: "10px",
                transition: "all 0.3s ease",
              }}
              onClick={() => setActiveTab("discussion")}
            >
              Feed
            </button>
          </li>
        </ul>

        {/* Content scrolls UNDER the sticky tabs */}
        <div className="tab-content mt-3">
          {activeTab === 'matches' && <Matches />}
          {activeTab === 'discussion' && <CommunityFeed user={user} />}
          {activeTab === 'tournaments' && <Tournaments />}
        </div>
      </div>
    </>
  );
}

export default Home;