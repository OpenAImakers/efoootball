
export default function SingleEliminationLayout({ tournament }: { tournament: any }) {
  return (
    <div className="text-center py-5 bg-dark border border-warning rounded-4 shadow-lg">
      <h3 className="text-warning">Single Elimination Bracket</h3>
      <p className="text-muted">Coming Soon for {tournament.name}</p>
    </div>
  );
}