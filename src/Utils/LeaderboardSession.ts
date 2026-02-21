// LeaderboardSession.ts

// Get the currently active leaderboard from localStorage
export const getActiveLeaderboard = () => {
  const data = localStorage.getItem('active_leaderboard');
  return data ? JSON.parse(data) : null;
};

// Log in (activate) a leaderboard
export const loginToLeaderboard = (id: string, name: string) => {
  localStorage.setItem(
    'active_leaderboard',
    JSON.stringify({ id, name })
  );
};

// Log out (deactivate) a leaderboard
export const logoutFromLeaderboard = () => {
  localStorage.removeItem('active_leaderboard');
  window.location.reload(); // Refresh UI to show the "Join" or list again
};