import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/ExternalHeader";
import Tournaments from "./Tournaments";

function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div
      className="w-100 m-0 p-0 overflow-x-hidden"
      style={{ minHeight: "100vh"}}
    >
      <Navbar />

      {/* Spacer for Main Navbar */}
      <div style={{ height: "60px" }}></div>

      {/* Main Content Area */}
      <main className="w-100 m-0 p-0">
        <div className="w-100 fade-in-animation">
          <Tournaments />
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

        body, html {
          overflow-x: hidden;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default Home;