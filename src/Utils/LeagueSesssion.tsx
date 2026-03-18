// LeagueSession.ts

// Get the currently managed league from localStorage
export const getActiveLeague = () => {
  const data = localStorage.getItem('active_league');
  return data ? JSON.parse(data) : null;
};

// Log in (activate) a league for management
export const loginToLeague = (id: string, name: string) => {
  localStorage.setItem(
    'active_league',
    JSON.stringify({ id, name })
  );
};

// Log out (deactivate) the league management session
export const logoutFromLeague = () => {
  localStorage.removeItem('active_league');
  window.location.reload(); // Refresh UI to show league list
};