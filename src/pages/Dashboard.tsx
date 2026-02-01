import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Matches from "./Matches"; 
import Tournaments from "./Tournaments";
import CommunityFeed from "./CommunityFeed"; 
import Winner from "./Winner";
function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
<>
  <Navbar />

  <div className="container-fluid" style={{ marginTop: '5rem' }}>
    {/* Secondary Navbar (Sticky Tabs) */}
    <ul
      className="nav nav-pills nav-fill p-1 bg-light shadow-sm"
      style={{
        position: "sticky",
        top: "64px",
        zIndex: 999
      }}
    >
      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Matches
        </button>
      </li>

      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === 'discussion' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussion')}
        >
          Community Feed
        </button>
      </li>
            <li className="nav-item">
        <button
          className={`nav-link ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
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
  
  <Winner 
    teamName="Colo_Colo" 
    goalsScored={28}
    matchesWon={5} 
    totalPoints={15}
  />  
</>

  );
}

export default Home;