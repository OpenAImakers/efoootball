import { useState } from "react";

interface Match {
  id: number;
  home_team: { name: string };
  away_team: { name: string };
  stage: string;
}

interface ChallengeProps {
  match: Match;
}

interface ChallengeItem {
  id: number;
  user: string;
  outcome: string;
  amount: number;
}

export default function Challenge({ match }: ChallengeProps) {
  // Local State Mock Data
  const [challenges, setChallenges] = useState<ChallengeItem[]>([
    { id: 1, user: "Skyla", outcome: `${match.home_team.name} Wins`, amount: 50 },
    { id: 2, user: "Isack", outcome: `${match.home_team.name} Wins`, amount: 100 },
    { id: 3, user: "Newton", outcome: "Draw", amount: 75 },
    { id: 4, user: "KhanyareFan", outcome: `${match.away_team.name} Wins`, amount: 120 },
  ]);

  const [activeTab, setActiveTab] = useState<string>(`${match.home_team.name} Wins`);
  const [selectionBoxOpen, setSelectionBoxOpen] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");

  const handleSelectOutcome = (outcome: string) => {
    setSelectedOutcome(outcome);
    setSelectionBoxOpen(true);
  };

  const handleCreateChallenge = () => {
    const amount = parseInt(amountInput);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    const newChallenge: ChallengeItem = {
      id: Date.now(),
      user: "You",
      outcome: selectedOutcome,
      amount: amount,
    };

    setChallenges((prev) => [...prev, newChallenge]);
    setAmountInput("");
    setSelectionBoxOpen(false);
  };

  const handleAcceptChallenge = (id: number, user: string, amount: number) => {
    alert(`You accepted ${user}'s challenge of ${amount} KSh!`);
    setChallenges((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredChallenges = challenges.filter((c) => c.outcome === activeTab);

  return (
    <div className="container-fluid w-100 px-0 mt-4" style={{ fontFamily: "sans-serif" }}>
      <div className="card shadow-sm border-0 p-4 p-md-5" style={{ background: "#f4f8ff", borderRadius: "16px" }}>
        
        {/* Header Section */}
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2 tracking-tight" style={{ color: "#1565c0", fontSize: "28px" }}>
            Rankings Challenges
          </h2>
          <p className="text-muted small text-uppercase fw-semibold tracking-wider">
            Select an outcome to create or challenge predictions
          </p>
        </div>

        {/* Dynamic Multi-Column Action Buttons */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <button
              className="btn w-100 py-3 fw-bold border-2 text-center shadow-sm position-relative overflow-hidden"
              style={{ 
                borderColor: "#1565c0", 
                color: "#1565c0", 
                background: "#ffffff",
                borderRadius: "12px",
                transition: "transform 0.15s ease, background 0.15s ease"
              }}
              onClick={() => handleSelectOutcome(`${match.home_team.name} Wins`)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef5ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              <div className="text-truncate mb-1">{match.home_team.name}</div>
              <span className="fs-5 tracking-wide font-monospace opacity-75">1.54</span>
            </button>
          </div>
          <div className="col-md-4">
            <button
              className="btn w-100 py-3 fw-bold border-2 text-center shadow-sm"
              style={{ 
                borderColor: "#1565c0", 
                color: "#1565c0", 
                background: "#ffffff",
                borderRadius: "12px",
                transition: "transform 0.15s ease, background 0.15s ease"
              }}
              onClick={() => handleSelectOutcome("Draw")}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef5ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              <div className="mb-1">Draw</div>
              <span className="fs-5 tracking-wide font-monospace opacity-75">2.60</span>
            </button>
          </div>
          <div className="col-md-4">
            <button
              className="btn w-100 py-3 fw-bold border-2 text-center shadow-sm"
              style={{ 
                borderColor: "#1565c0", 
                color: "#1565c0", 
                background: "#ffffff",
                borderRadius: "12px",
                transition: "transform 0.15s ease, background 0.15s ease"
              }}
              onClick={() => handleSelectOutcome(`${match.away_team.name} Wins`)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef5ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              <div className="text-truncate mb-1">{match.away_team.name}</div>
              <span className="fs-5 tracking-wide font-monospace opacity-75">5.40</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Input Box */}
        {selectionBoxOpen && (
          <div className="p-4 mb-4 shadow-sm border" style={{ backgroundColor: "#eef5ff", borderColor: "#d7e6ff", borderRadius: "14px" }}>
            <h5 className="fw-bold mb-2 text-uppercase tracking-wider small" style={{ color: "#1565c0" }}>Selection</h5>
            <div className="fw-bold mb-3 text-dark fs-4 tracking-tight">
              {selectedOutcome}
            </div>
            <div className="row g-3 align-items-center">
              <div className="col-md-8">
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-muted px-3" style={{ borderRadius: "10px 0 0 10px" }}>KSh</span>
                  <input
                    type="number"
                    className="form-control border-start-0 py-2 fs-6 fw-bold"
                    style={{ borderRadius: "0 10px 10px 0 focus" }}
                    placeholder="Enter amount"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <button 
                  className="btn text-white w-100 py-2 fw-bold text-uppercase tracking-wide shadow-sm" 
                  style={{ backgroundColor: "#1565c0", borderRadius: "10px" }}
                  onClick={handleCreateChallenge}
                >
                  Create Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Filters */}
        <div className="nav nav-pills row g-2 mb-4 text-center border-bottom pb-3 mx-0" role="tablist">
          <div className="col">
            <button
              className="nav-link w-100 fw-bold py-2 text-truncate transition"
              style={{ 
                backgroundColor: activeTab === `${match.home_team.name} Wins` ? "#1565c0" : "#dce9ff",
                color: activeTab === `${match.home_team.name} Wins` ? "#ffffff" : "#1565c0",
                borderRadius: "10px"
              }}
              onClick={() => setActiveTab(`${match.home_team.name} Wins`)}
            >
              {match.home_team.name}
            </button>
          </div>
          <div className="col">
            <button
              className="nav-link w-100 fw-bold py-2 transition"
              style={{ 
                backgroundColor: activeTab === "Draw" ? "#1565c0" : "#dce9ff",
                color: activeTab === "Draw" ? "#ffffff" : "#1565c0",
                borderRadius: "10px"
              }}
              onClick={() => setActiveTab("Draw")}
            >
              Draw
            </button>
          </div>
          <div className="col">
            <button
              className="nav-link w-100 fw-bold py-2 text-truncate transition"
              style={{ 
                backgroundColor: activeTab === `${match.away_team.name} Wins` ? "#1565c0" : "#dce9ff",
                color: activeTab === `${match.away_team.name} Wins` ? "#ffffff" : "#1565c0",
                borderRadius: "10px"
              }}
              onClick={() => setActiveTab(`${match.away_team.name} Wins`)}
            >
              {match.away_team.name}
            </button>
          </div>
        </div>

        {/* Interactive Challenges Stack Display */}
        <div className="d-flex flex-column gap-3">
          {filteredChallenges.length === 0 ? (
            <div className="text-center text-muted py-5 my-0 bg-white rounded border border-light shadow-sm">
              <span className="small text-uppercase fw-semibold tracking-wider text-secondary">
                No active challenges listed for this outcome
              </span>
            </div>
          ) : (
            filteredChallenges.map((item) => (
              <div
                key={item.id}
                className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center p-3 px-4 rounded bg-white border border-light shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <div className="mb-3 mb-sm-0">
                  <div className="fw-bold text-dark fs-5 tracking-tight mb-1">{item.user}</div>
                  <span className="badge bg-light text-secondary border px-2.5 py-1.5 fw-medium">
                    {item.outcome} • <span className="fw-bold text-dark">{item.amount} KSh</span>
                  </span>
                </div>
                <button
                  className="btn text-white px-4 py-2 text-nowrap w-100 w-sm-auto fw-bold text-uppercase tracking-wide shadow-sm"
                  style={{ backgroundColor: "#1565c0", borderRadius: "10px" }}
                  onClick={() => handleAcceptChallenge(item.id, item.user, item.amount)}
                >
                  Challenge
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}