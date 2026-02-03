import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
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
  path="/admin"
  element={
    <ProtectedRoute requiredRole={null}>
      {/* Add the opening brace here */}
      {({ user, role }) =>
        role === "admin" ? (
          <Admin user={user} role={role} />
        ) : role === "leaderboard" ? (
          <Leaderboardadmin user={user} role={role} />
        ) : (
          <>
            <Navbar />
            <div style={{ padding: "40px", textAlign: "center", marginTop: "60px" }}>
              <h2>Access Restricted</h2>
              <p>This admin area is only for authorized administrators.</p>
              <p>Your role: {role || "none"}</p>
            </div>
          </>
        )
      } 
      {/* Add the closing brace here */}
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