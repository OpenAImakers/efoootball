export default function TournamentsTab() {
  return (
    <div>
      <h5 className="text-muted border-bottom pb-2 mb-3">Tournaments Created</h5>
      <div className="text-center py-5 text-muted">
        <i className="bi bi-trophy fs-1 opacity-25"></i>
        <p className="mt-2">No tournaments created yet</p>
        <small>When you create tournaments, they will appear here</small>
      </div>
    </div>
  );
}