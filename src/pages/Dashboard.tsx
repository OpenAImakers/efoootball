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
      <div className="mt-5 pt-3 container-fluid" style={{ maxWidth: "100%" }}>
        
        {/* Simplified Tabs */}
        <ul className="nav nav-pills nav-fill mb-4 p-1 bg-light rounded shadow-sm">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
              Matches
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
              Community Feed
            </button>
          </li>
        </ul>

        {/* Dynamic Tab Rendering */}
        <div className="tab-content">
          {activeTab === 'matches' ? <Matches /> : <CommunityFeed user={user} />}
        </div>
        
      </div>
    </>
  );
}

export default Home;