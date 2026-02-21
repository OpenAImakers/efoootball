import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import TournamentAdmin from "./pages/Admin";
import Dashboard from "./pages/Dashboard.tsx";
import Teams from "./pages/Team.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Account from "./pages/Account";  
import ProfileView from "./pages/ProfileView.tsx";
import MatchVote from "./pages/MatchVote.tsx";   
import UpdatePassword from "./pages/UpdatePassword.js";
import Leaderboard from "./pages/Leaderboard.tsx";  
import LeaderboardForm from "./pages/Leaderboardadmin.tsx";
import Navbar from "./components/Navbar.jsx";
import UpgradeToAdmin from "./pages/UpgradeToAdmin.tsx";
import TournamentCreation from "./pages/TournamentCreation.tsx";
import TournamentList from "./pages/TournamentList.tsx";
import NoLeaderboardState from "./pages/NoLeaderboardState.tsx";
import LeaderboardList from "./pages/LeaderboardList.tsx";
import LeaderboardCreation from "./pages/LeaderboardCreation.tsx";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      
      {/* Password Update Route 
          Keep this public so the email link can reach it without redirection loops 
      */}
      <Route path="/update-password" element={<UpdatePassword />} />

      
            <Route
        path="/leaderboard-list"
        element={
          <ProtectedRoute>
            <LeaderboardList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <Teams />
          </ProtectedRoute>
        }
      />  
            <Route
        path="/tournament-list"
        element={
          <ProtectedRoute>
            <TournamentList />
          </ProtectedRoute>
        }
      /> 

<Route
  path="/leaderboard-admin"
  element={
    <ProtectedRoute>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ flex: 1, marginTop: "65px" }}>
          <NoLeaderboardState />
        </div>
      </div>
    </ProtectedRoute>
  }
/>
        
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole={null}>
      {({ user }) => {
        // We prioritize session keys over role checks
        const hasActiveTournament = localStorage.getItem("active_tournament");
        const hasActiveLeaderboard = localStorage.getItem("active_leaderboard");

        // 1. If a Tournament Session is active, show Tournament Admin
        if (hasActiveTournament) {
          return <TournamentAdmin user={user} />;
        }

        // 2. If a Leaderboard Session is active, show Leaderboard Admin
        if (hasActiveLeaderboard) {
          return <LeaderboardForm />;
        }

        // 3. Fallback: No active session? 
        // Show the selection screen so they can use their passkey/select a session
        return (
          <>
            <Navbar />
            <UpgradeToAdmin />
          </>
        );
      }}
    </ProtectedRoute>
  }
/>
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
            <Route
        path="/create-tournament"
        element={
          <ProtectedRoute>
            <TournamentCreation  />
          </ProtectedRoute>
        }
      />
                  <Route
        path="/Leaderboard-create"
        element={
          <ProtectedRoute>
            
            <LeaderboardCreation  />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <ProtectedRoute>
            <ProfileView />
          </ProtectedRoute>
        }
      />
      <Route  
        path="/match/:id/vote"
        element={
          <ProtectedRoute>
            <MatchVote />
          </ProtectedRoute>
        }
      />  
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
    </Routes>

  );
}

export default App;
