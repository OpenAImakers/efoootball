import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
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
import Advert from "./components/Advert.jsx";
import Winner from "./pages/Winner.tsx";  
import UpgradeToAdmin from "./pages/UpgradeToAdmin.tsx";
import TournamentCreation from "./pages/TournamentCreation.tsx";
import TournamentList from "./pages/TournamentList.tsx";
import NoLeaderboardState from "./pages/NoLeaderboardState.tsx";
import LeaderboardList from "./pages/LeaderboardList.tsx";
import LeaderboardCreation from "./pages/LeaderboardCreation.tsx";
import Register from "./pages/Register.tsx";
import Leagues from "./pages/Leagues.tsx";


function App() {
  // Detect PWA vs browser
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
useEffect(() => {
  const loader = document.getElementById("splash-loader");
  if (loader) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.6s ease";

    setTimeout(() => {
      loader.style.display = "none";
    }, 600);
  }
}, []);
  return (
    <Routes>
      {/* PWA starts at /auth, browser starts at / (Advert) */}
      <Route
        path="/"
        element={isStandalone ? <Navigate to="/auth" /> : <Advert />}
      />
      <Route path="/auth" element={<Auth />} />

      {/* Password Update Route */}
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* Other existing routes unchanged */}
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
        path="/register"
        element={
          <ProtectedRoute>
            <Register/>
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
        path="/leagues"
        element={
          <ProtectedRoute>
            <Leagues />
          </ProtectedRoute>
        }
      />
            <Route
        path="/sports"
        element={
          <ProtectedRoute>
            <Winner />
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
              const hasActiveTournament = localStorage.getItem("active_tournament");
              const hasActiveLeaderboard = localStorage.getItem("active_leaderboard");

              if (hasActiveTournament) {
                return <TournamentAdmin user={user} />;
              }
              if (hasActiveLeaderboard) {
                return <LeaderboardForm />;
              }
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
            <TournamentCreation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/Leaderboard-create"
        element={
          <ProtectedRoute>
            <LeaderboardCreation />
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