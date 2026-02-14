// TournamentSession.ts
export const getActiveTournament = () => {
  const data = localStorage.getItem('active_tournament');
  return data ? JSON.parse(data) : null;
};

export const loginToTournament = (id: number, name: string) => {
  localStorage.setItem('active_tournament', JSON.stringify({ id, name }));
};

export const logoutFromTournament = () => {
  localStorage.removeItem('active_tournament');
  window.location.reload(); // Refresh to show the "Join" list again
};