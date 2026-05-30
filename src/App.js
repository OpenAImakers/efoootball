import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Auth from "./pages/Auth";
import TournamentAdmin from "./pages/Admin";
import Dashboard from "./pages/Dashboard.tsx";
import Teams from "./pages/Team.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Account from "./pages/profile/Account";  
import ProfileView from "./pages/ProfileView.tsx";
import MatchVote from "./pages/MatchVote.tsx";   
import UpdatePassword from "./pages/UpdatePassword.js";
import Leaderboard from "./pages/Leaderboard.tsx";  
import LeaderboardForm from "./pages/Leaderboardadmin.tsx";
import Navbar from "./components/Navbar.jsx";
import Winner from "./pages/Winner.tsx";  
import UpgradeToAdmin from "./pages/UpgradeToAdmin.tsx";
import TournamentCreation from "./pages/TournamentCreation.tsx";
import TournamentList from "./pages/TournamentList.tsx";
import LeaderboardCreation from "./pages/LeaderboardCreation.tsx";
import Register from "./pages/Register.tsx";
import Leagues from "./pages/leagues/AllLeagues.tsx";
import TeamMatches  from "./pages/TeamMatches.tsx";
import SpecificLeague from "./pages/leagues/SpecificLeague.tsx";
import LandingPage  from "./pages/leagues/LandingLeaguePage.tsx";
import RegistrationsAdmin from "./pages/RegistrationsAdmin.tsx";
import LeagueManagement from "./pages/leagues/Manageleague.tsx";
import AddLeague from "./pages/leagues/Addleague.tsx";
import Registrations from "./pages/CreateRegistrations.tsx";
import SpecificRegistration from "./pages/SpecificRegistration.tsx";
import SendSms from "./pages/sms/Sendsms";
import Announcements from "./pages/Announcement/Announcement";
import Fie from "./fie/Fie.tsx";
import RegisterClans from "./fie/components/RegisterClans";
import SpecificClanRegistration from "./fie/components/SpecificClanRegistration";
import Clans from "./fie/clans/Clans";

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
      {/* fie routes */}
        <Route
        path="/clans"
        element={
            <Clans />
        }
      />

      <Route
        path="/fie"
        element={
            <Fie />
        }
      />
      <Route
      path="/registerclans"
      element={
    <ProtectedRoute>
        <RegisterClans />
        </ProtectedRoute>
      }
      />
      
      <Route
        path="/registerclans/:id"
        element={
          <ProtectedRoute>
            <SpecificClanRegistration />
          </ProtectedRoute>
        }
      />

      {/* sms routes */}


            <Route
  path="/sendsms"
  element={
    <ProtectedRoute>
      <SendSms />
    </ProtectedRoute>
  }
/>
{/* announcement routes */}

                  <Route
        path="/announcements"
        element={
        
            <Announcements />
        }
      />

      {/* leagues routes */}

   <Route
        path="/leaguelandingpage"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />
      <Route
  path="/manage-league"
  element={
    <ProtectedRoute>
      <LeagueManagement />
    </ProtectedRoute>
  }
/>
   <Route
  path="/add-league"
  element={
    <ProtectedRoute>
      <AddLeague />
    </ProtectedRoute>
  }
/>

      {/* leagues routes end */}



     {/* Registration route */}


         <Route
        path="/registrations"
        element={
          <ProtectedRoute>
               <Registrations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/registration/:id"
        element={
          <ProtectedRoute>
            <SpecificRegistration />
          </ProtectedRoute>
        }
      />

        <Route
        path="/registrations-admin"
        element={
          <ProtectedRoute>
            <RegistrationsAdmin />
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


     {/* Registration routes */}



      
      {/* PWA starts at /auth, browser starts at / (Advert) */}
      <Route
        path="/"
        element={isStandalone ? <Navigate to="/auth" /> : <Leaderboard/>}
      />

      <Route path="/auth" element={<Auth />} />

      {/* Password Update Route */}
      <Route path="/update-password" element={<UpdatePassword />} />



      {/* Other existing routes unchanged */}
         <Route
  path="/league/:id"
  element={

      <SpecificLeague />

  }
/>
      <Route 
  path="/team/:username/matches" 
  element={
    
      <TeamMatches />
 
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
        path="/leagues"
        element={
        
            <Leagues />
        
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