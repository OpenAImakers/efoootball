import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Matches from "./Matchvote/Matches"; 
import Tournaments from "./Tournaments";
import CommunityFeed from "./CommunityFeed"; 

const BRAND = {
  NAVY: "#1A2251",
  ORANGE: "#F38D1F",
  WHITE: "#FFFFFF",
};

function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tournaments');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const tabs = [
    { id: 'tournaments', label: 'ONGOING' },
    { id: 'matches', label: 'MATCHES' },
    { id: 'discussion', label: 'COMMUNITY' },
  ];

  return (
    <div className="w-100 m-0 p-0 overflow-x-hidden" style={{ minHeight: "100vh", backgroundColor: "#020617" }}>
      <Navbar />

      {/* 1. FIXED SECONDARY NAVBAR - Round & Centered, No White Background */}
      <div 
        className="fixed-top w-100 d-flex justify-content-center align-items-center py-2 px-2" 
        style={{ 
          top: "56px", // Adjust this to match your main Navbar height
          zIndex: 1020,
          backgroundColor: "transparent", // Changed from rgba white to transparent
        }}
      >
        <div 
          className="d-flex shadow-lg" 
          style={{ 
            maxWidth: "600px", 
            width: "90%", // Responsive width
            backgroundColor: BRAND.NAVY, 
            borderRadius: "100px", 
            padding: "4px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn flex-fill border-0 fw-black p-0"
              style={{
                fontSize: "0.7rem",
                height: "38px",
                letterSpacing: "1px",
                borderRadius: "100px",
                backgroundColor: activeTab === tab.id ? BRAND.ORANGE : "transparent",
                color: BRAND.WHITE,
                transition: "all 0.2s ease-in-out",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SPACER (Prevents content from hiding under fixed bar) */}
      <div style={{ height: "125px" }}></div> 

      {/* 3. FULL WIDTH CONTENT AREA */}
      <main className="w-100 m-0 p-0">
        <div className="w-100">
          {activeTab === 'matches' && (
            <div className="w-100 fade-in-animation"><Matches /></div>
          )}
          {activeTab === 'discussion' && (
            <div className="w-100 fade-in-animation"><CommunityFeed user={user} /></div>
          )}
          {activeTab === 'tournaments' && (
            <div className="w-100 fade-in-animation"><Tournaments /></div>
          )}
        </div>
      </main>

      <style>{`
        .fw-black { font-weight: 900 !important; }
        .w-100 { width: 100% !important; }
        
        .fade-in-animation {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Prevent any horizontal scrolling from children */
        body, html {
          overflow-x: hidden;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default Home;