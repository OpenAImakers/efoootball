interface MyTeamTabProps {
  teams: { id: number; name: string }[];
}

export default function MyTeamTab({ teams }: MyTeamTabProps) {
  return (
    <div className="p-2">
      {teams.length > 0 ? (
        <div>
          <h5 className="fw-bold text-start mb-3 text-muted text-uppercase small">Your Teams</h5>
          <div className="row g-3">
            {teams.map((t) => (
              <div key={t.id} className="col-sm-6">
                <div className="card bg-primary text-white p-3 border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-start">
                      <div className="fw-bold small opacity-75">Team Name</div>
                      <h6 className="mb-1 fw-bold">{t.name}</h6>
                    </div>
                    <i className="bi bi-shield-check fs-2 opacity-50"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
            <i className="bi bi-people text-primary fs-3"></i>
          </div>
          <h4 className="fw-bold">No Teams Yet</h4>
          <p className="text-muted">When you register for a tournament and get confirmed, your team will automatically appear here.</p>
        </div>
      )}
    </div>
  );
}