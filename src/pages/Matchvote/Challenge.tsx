import { useState, useEffect } from "react";
import { supabase } from "../../supabase"; 

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
  creator_id: string;
  creator_pick: 'HOME' | 'AWAY' | 'DRAW';
  stake_amount: number;
  status: string;
}

export default function Challenge({ match }: ChallengeProps) {
  // 1. Functional State Management
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'HOME' | 'AWAY' | 'DRAW'>('HOME');
  const [selectionBoxOpen, setSelectionBoxOpen] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<'HOME' | 'AWAY' | 'DRAW'>('HOME');
  const [amountInput, setAmountInput] = useState<string>("");

  // 2. Load authenticated user identity and active challenges
  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data } = await supabase
        .from("challenges")
        .select("*")
        .eq("match_id", match.id)
        .eq("status", "open");

      if (data) setChallenges(data as ChallengeItem[]);
    };

    fetchUserAndData();
  }, [match.id]);

  const handleSelectOutcome = (outcome: 'HOME' | 'AWAY' | 'DRAW') => {
    setSelectedOutcome(outcome);
    setSelectionBoxOpen(true);
  };

  const handleCreateChallenge = async () => {
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    if (!userId) {
      alert("Please log in to create a challenge!");
      return;
    }

    const { data, error } = await supabase
      .from("challenges")
      .insert([
        {
          match_id: match.id,
          creator_id: userId,
          creator_pick: selectedOutcome,
          stake_amount: amount,
          status: "open"
        }
      ])
      .select()
      .single();

    if (error) {
      alert(`Database Error: ${error.message}`);
      return;
    }

    if (data) {
      setChallenges((prev) => [...prev, data as ChallengeItem]);
    }

    setAmountInput("");
    setSelectionBoxOpen(false);
  };

const handleAcceptChallenge = async (id: number, amount: number) => {
  if (!userId) {
    alert("Please log in to accept this challenge!");
    return;
  }

  try {
    // 1. Update the database table row via Supabase
    const { data, error } = await supabase
      .from("challenges")
      .update({
        challenger_id: userId,
        status: "accepted", // Adjust this if your challenge_status enum uses a different value
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "open") // Optimistic concurrency check: ensure it hasn't been taken already
      .select()
      .single();

    if (error) {
      // Handles cases like check_different_users violation or RLS row locks
      alert(`Failed to accept challenge: ${error.message}`);
      return;
    }

    if (data) {
      alert(`Success! Challenge matched for ${amount} KSh.`);
      
      // 2. Remove the challenge from the active UI state since its status is no longer "open"
      setChallenges((prev) => prev.filter((challenge) => challenge.id !== id));
    }
  } catch (err) {
    console.error("Error accepting challenge:", err);
    alert("An unexpected error occurred while processing the match.");
  }
};

  const outcomeLabels: Record<'HOME' | 'AWAY' | 'DRAW', string> = {
    HOME: `${match.home_team.name} Wins`,
    AWAY: `${match.away_team.name} Wins`,
    DRAW: "Draw Match"
  };

  const filteredChallenges = challenges.filter((c) => c.creator_pick === activeTab);

  return (
    <div className="container-fluid w-100 px-0 mt-4" style={{ fontFamily: "sans-serif" }}>
      {/* Container is now clean white to blend seamlessly with your main page */}
      <div className="card border-0 p-3 p-md-4 bg-white">
        
        {/* Header Section */}
        <div className="mb-4">
          <h4 className="fw-bold mb-1 tracking-tight" style={{ color: "#1e293b" }}>
            Match Challenges
          </h4>
          <p className="text-muted small mb-0">
            Select an outcome below to set your stake or match an open challenge.
          </p>
        </div>

        {/* Odds selection controls */}
        <div className="row g-2 mb-4">
          <div className="col-4">
            <button
              className="btn w-100 py-2.5 px-2 fw-bold text-center border shadow-sm position-relative"
              style={{ 
                borderColor: "#e2e8f0", 
                color: "#0f172a", 
                background: "#f8fafc",
                borderRadius: "10px",
                fontSize: "14px"
              }}
              onClick={() => handleSelectOutcome('HOME')}
            >
              <div className="text-truncate small mb-0.5">{match.home_team.name}</div>
              <span className="font-monospace text-primary fw-bold">1.54</span>
            </button>
          </div>
          <div className="col-4">
            <button
              className="btn w-100 py-2.5 px-2 fw-bold text-center border shadow-sm"
              style={{ 
                borderColor: "#e2e8f0", 
                color: "#0f172a", 
                background: "#f8fafc",
                borderRadius: "10px",
                fontSize: "14px"
              }}
              onClick={() => handleSelectOutcome('DRAW')}
            >
              <div className="small mb-0.5">Draw</div>
              <span className="font-monospace text-primary fw-bold">2.60</span>
            </button>
          </div>
          <div className="col-4">
            <button
              className="btn w-100 py-2.5 px-2 fw-bold text-center border shadow-sm"
              style={{ 
                borderColor: "#e2e8f0", 
                color: "#0f172a", 
                background: "#f8fafc",
                borderRadius: "10px",
                fontSize: "14px"
              }}
              onClick={() => handleSelectOutcome('AWAY')}
            >
              <div className="text-truncate small mb-0.5">{match.away_team.name}</div>
              <span className="font-monospace text-primary fw-bold">5.40</span>
            </button>
          </div>
        </div>

        {/* Dynamic Creation Box */}
        {selectionBoxOpen && (
          <div className="p-3 mb-4 border" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0", borderRadius: "12px" }}>
            <div className="small fw-semibold text-muted mb-1 text-uppercase tracking-wider">Creating challenge for:</div>
            <div className="fw-bold mb-3 text-dark fs-5">{outcomeLabels[selectedOutcome]}</div>
            
            <div className="row g-2 align-items-center">
              <div className="col-sm-8">
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-muted small">KSh</span>
                  <input
                    type="number"
                    className="form-control border-start-0 py-2 fw-bold"
                    placeholder="Enter stake amount"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-sm-4">
                <button 
                  className="btn btn-primary text-white w-100 py-2 fw-bold text-uppercase tracking-wide" 
                  style={{ borderRadius: "8px", fontSize: "14px" }}
                  onClick={handleCreateChallenge}
                >
                  Post Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Filters */}
        <div className="nav nav-pills row g-1 mb-3 text-center border-bottom pb-3 mx-0" role="tablist">
          <div className="col">
            <button
              className="nav-link w-100 fw-bold py-2 text-truncate small"
              style={{ 
                backgroundColor: activeTab === 'HOME' ? "#0f172a" : "transparent",
                color: activeTab === 'HOME' ? "#ffffff" : "#64748b",
                borderRadius: "8px"
              }}
              onClick={() => setActiveTab('HOME')}
            >
              {match.home_team.name}
            </button>
          </div>
          <div className="col">
            <button
              className="nav-link w-100 fw-bold py-2 small"
              style={{ 
                backgroundColor: activeTab === 'DRAW' ? "#0f172a" : "transparent",
                color: activeTab === 'DRAW' ? "#ffffff" : "#64748b",
                borderRadius: "8px"
              }}
              onClick={() => setActiveTab('DRAW')}
            >
              Draws
            </button>
          </div>
          <div className="col">
            <button
              className="nav-link w-100 fw-bold py-2 text-truncate small"
              style={{ 
                backgroundColor: activeTab === 'AWAY' ? "#0f172a" : "transparent",
                color: activeTab === 'AWAY' ? "#ffffff" : "#64748b",
                borderRadius: "8px"
              }}
              onClick={() => setActiveTab('AWAY')}
            >
              {match.away_team.name}
            </button>
          </div>
        </div>

        {/* Challenge Items Stack List */}
        {/* Challenge Items Stack List */}
        <div className="d-flex flex-column gap-2">
          {filteredChallenges.length === 0 ? (
            <div className="text-center text-muted py-4 bg-light rounded-3 border border-dashed">
              <span className="small fw-medium tracking-wide">
                No active challenges under this pool.
              </span>
            </div>
          ) : (
            filteredChallenges.map((item) => (
              <div
                key={item.id}
                className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-white"
                style={{ borderColor: "#f1f5f9" }}
              >
                {/* Left side: Clean info hint */}
                <div>
                  <span className="small fw-semibold text-secondary">
                    {item.creator_id === userId ? "Your Listing" : "Open Pool"}
                  </span>
                </div>

                {/* Right side action block displaying amounts directly */}
                <div>
                  {item.creator_id === userId ? (
                    <div 
                      className="px-3 py-1.5 fw-bold text-center border font-monospace" 
                      style={{ 
                        backgroundColor: "#f8fafc", 
                        color: "#475569", 
                        borderRadius: "6px",
                        fontSize: "14px"
                      }}
                    >
                      {item.stake_amount} KSh
                    </div>
                  ) : (
                    <button
                      className="btn btn-success text-white px-3 py-1.5 fw-bold shadow-sm"
                      style={{ borderRadius: "6px", fontSize: "14px" }}
                      onClick={() => handleAcceptChallenge(item.id, item.stake_amount)}
                    >
                      <span className="font-monospace me-1">{item.stake_amount} KSh</span> Challenge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}