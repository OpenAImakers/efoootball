import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Matches from "./Matches"; 
import CommunityFeed from "./CommunityFeed"; // Import the new component

function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
<>
  <Navbar />

  <div className="container-fluid">
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
    </ul>

    {/* Content scrolls UNDER the sticky tabs */}
    <div className="tab-content mt-3">
      {activeTab === 'matches' ? <Matches /> : <CommunityFeed user={user} />}
    </div>
  </div>
</>

  );
}

export default Home;