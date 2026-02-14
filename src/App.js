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
import Leaderboardadmin from "./pages/Leaderboardadmin.tsx";
import Navbar from "./components/Navbar.jsx";
import UpgradeToAdmin from "./pages/UpgradeToAdmin.tsx";
import TournamentCreation from "./pages/TournamentCreation.tsx";
import TournamentList from "./pages/TournamentList.tsx";
import NoLeaderboardState from "./pages/NoLeaderboardState.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      
      {/* Password Update Route 
          Keep this public so the email link can reach it without redirection loops 
      */}
      <Route path="/update-password" element={<UpdatePassword />} />

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
    <ProtectedRoute requiredRole={null}>
      {({ user, role }) =>
        role === "leaderboard" ? (
          <Leaderboardadmin user={user} role={role} />
        ) : (
          <div style={{ padding: "20px" }}>
            <Navbar />
            <NoLeaderboardState />
          </div>
        )
      }
    </ProtectedRoute>
  }
/>
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole={null}>
      {({ user, role }) => {
        // 1. Check if they have picked a tournament session locally
        const hasActiveSession = localStorage.getItem("active_tournament");

        // 2. Logic for Tournament Admins
        if (role === "admin") {
          if (hasActiveSession) {
            // They are an admin AND they have selected a tournament to manage
            return <TournamentAdmin user={user} role={role} />;
          } else {
            // They are an admin but want to pick/create a tournament
            return (
              <>
                <Navbar />
                <UpgradeToAdmin role={role} />
              </>
            );
          }
        }

        // 3. Logic for Leaderboard Admins
        if (role === "leaderboard") {
          return <Leaderboardadmin user={user} role={role} />;
        }

        // 4. Fallback for Members/Guests
        return (
          <>
            <Navbar />
            <UpgradeToAdmin role={role} />
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
