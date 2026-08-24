import React from "react";

export interface Jackpot {
  id: string;
  name: string;
  game_count: number;
  entry_fee: number;
  prize_amount: number | null;
  status: "draft" | "open" | "closed" | "settled";
  starts_at: string | null;
  closes_at: string | null;
  created_at?: string;
}

export interface JackpotGame {
  id: string;
  jackpot_id: string;
  game_number: number;
  home_team: string;
  away_team: string;
  match_time: string | null;
  home_score: number | null;
  away_score: number | null;
  outcome: "HOME" | "DRAW" | "AWAY" | null;
  status: "pending" | "finished" | "cancelled";
  created_at?: string;
}

export interface ScoreInput {
  home_score: string;
  away_score: string;
}

interface UpdateJackpotMatchesProps {
  jackpots: Jackpot[];
  selectedJackpotId: string;
  setSelectedJackpotId: (id: string) => void;
  selectedJackpot: Jackpot | null;
  games: JackpotGame[];
  scoreInputs: Record<string, ScoreInput>;
  loading: boolean;
  onScoreChange: (gameId: string, field: keyof ScoreInput, value: string) => void;
  onUpdateGameScore: (gameId: string) => void;
  onUpdateStatus: (status: "draft" | "open" | "closed" | "settled") => void;
  onSettleJackpot: () => void;
}

export default function UpdateJackpotMatches({
  jackpots,
  selectedJackpotId,
  setSelectedJackpotId,
  selectedJackpot,
  games,
  scoreInputs,
  loading,
  onScoreChange,
  onUpdateGameScore,
  onUpdateStatus,
  onSettleJackpot,
}: UpdateJackpotMatchesProps) {
  return (
    <section style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
      <h2>2. Update Match Results & Status</h2>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "bold", marginRight: "10px" }}>Select Jackpot:</label>
        <select
          value={selectedJackpotId}
          onChange={(e) => setSelectedJackpotId(e.target.value)}
          style={{ padding: "8px", minWidth: "320px" }}
        >
          <option value="" disabled>-- Select Jackpot --</option>
          {jackpots.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name} (KSh {j.entry_fee}) | Status: [{j.status.toUpperCase()}]
            </option>
          ))}
        </select>
      </div>

      {selectedJackpot && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          >
            <div>
              <strong>Name: </strong>{selectedJackpot.name} |
              <strong style={{ marginLeft: "10px" }}>Fee: </strong>KSh {selectedJackpot.entry_fee} |
              {selectedJackpot.prize_amount !== null && (
                <span style={{ marginLeft: "10px" }}>
                  <strong>Prize: </strong>KSh {selectedJackpot.prize_amount.toLocaleString()} |
                </span>
              )}
              <strong style={{ marginLeft: "10px" }}>Status: </strong>
              <span style={{ textTransform: "uppercase", fontWeight: "bold", color: "#1976d2" }}>
                {selectedJackpot.status}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {selectedJackpot.status === "open" && (
                <button
                  onClick={() => onUpdateStatus("closed")}
                  disabled={loading}
                  style={{ padding: "6px 12px", backgroundColor: "#ff9800", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Close Jackpot
                </button>
              )}

              {selectedJackpot.status === "closed" && (
                <>
                  <button
                    onClick={() => onUpdateStatus("open")}
                    disabled={loading}
                    style={{ padding: "6px 12px", backgroundColor: "#4caf50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Re-open
                  </button>

                  <button
                    onClick={onSettleJackpot}
                    disabled={loading}
                    style={{ padding: "6px 12px", backgroundColor: "#9c27b0", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Settle Jackpot
                  </button>
                </>
              )}

              {selectedJackpot.status === "settled" && (
                <span style={{ color: "#2e7d32", fontWeight: "bold" }}>✓ Settled</span>
              )}
            </div>
          </div>

          <h3>Matches Result Table</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#eee" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Game #</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Match</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Home Score</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Away Score</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Outcome</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>#{g.game_number}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <strong>{g.home_team}</strong> vs <strong>{g.away_team}</strong>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <input
                      type="number"
                      min="0"
                      value={scoreInputs[g.id]?.home_score ?? ""}
                      onChange={(e) => onScoreChange(g.id, "home_score", e.target.value)}
                      style={{ width: "60px", padding: "6px" }}
                    />
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <input
                      type="number"
                      min="0"
                      value={scoreInputs[g.id]?.away_score ?? ""}
                      onChange={(e) => onScoreChange(g.id, "away_score", e.target.value)}
                      style={{ width: "60px", padding: "6px" }}
                    />
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <strong style={{ color: g.outcome ? "#1976d2" : "#999" }}>
                      {g.outcome || "PENDING"}
                    </strong>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        backgroundColor: g.status === "finished" ? "#e8f5e9" : "#fff3e0",
                        color: g.status === "finished" ? "#2e7d32" : "#e65100",
                      }}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <button
                      onClick={() => onUpdateGameScore(g.id)}
                      disabled={loading || selectedJackpot.status === "settled"}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#008cba",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Update Score
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}