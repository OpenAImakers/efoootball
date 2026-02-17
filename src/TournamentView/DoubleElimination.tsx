export default function DoubleEliminationLayout({ tournament }: { tournament: any }) {
  return (
    <div className="text-center py-5 bg-dark border border-info rounded-4 shadow-lg">
      <h3 className="text-info">Double Elimination Bracket</h3>
      <p className="text-muted">Coming Soon for {tournament.name}</p>
    </div>
  );
}