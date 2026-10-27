import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabase";
import type {
  SurvivorMatch,
  SurvivorPool,
  SurvivorPlayer,
  SurvivorRound,
} from "./useSurvivorTab";

interface FlashMessage {
  type: "success" | "error" | "";
  text: string;
}

interface ScoreInput {
  home_score: string;
  away_score: string;
}

export default function SurvivorAdmin() {
  const [pools, setPools] = useState<SurvivorPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [rounds, setRounds] = useState<SurvivorRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [matches, setMatches] = useState<SurvivorMatch[]>([]);
  const [players, setPlayers] = useState<SurvivorPlayer[]>([]);
  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInput>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<FlashMessage>({ type: "", text: "" });

  // Create pool form
  const [newName, setNewName] = useState<string>("");
  const [newFee, setNewFee] = useState<string>("100");
  const [newRake, setNewRake] = useState<string>("15");
  const [newMaxEntries, setNewMaxEntries] = useState<string>("1");
  const [newClosesAt, setNewClosesAt] = useState<string>("");

  // Add round / add match forms
  const [newRoundClosesAt, setNewRoundClosesAt] = useState<string>("");
  const [newHome, setNewHome] = useState<string>("");
  const [newAway, setNewAway] = useState<string>("");
  const [newMatchTime, setNewMatchTime] = useState<string>("");
  const [newEventId, setNewEventId] = useState<string>("");

  const [forceSplit, setForceSplit] = useState<boolean>(false);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 6000);
  }, []);

  // ---------------------------------------------------------------- fetches
  const fetchPools = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("survivor_pools")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("error", `Error loading pools: ${error.message}`);
    } else {
      setPools((data || []) as SurvivorPool[]);
    }
    setLoading(false);
  }, [showMessage]);

  const fetchPoolData = useCallback(
    async (poolId: string) => {
      if (!poolId) {
        setRounds([]);
        setPlayers([]);
        setMatches([]);
        return;
      }

      const roundsRes = await supabase
        .from("survivor_rounds")
        .select("*")
        .eq("pool_id", poolId)
        .order("round_number", { ascending: true });
      if (roundsRes.error) {
        showMessage("error", `Error loading rounds: ${roundsRes.error.message}`);
      }
      setRounds((roundsRes.data || []) as SurvivorRound[]);

      const playersRes = await supabase
        .from("survivor_players")
        .select("*")
        .eq("pool_id", poolId)
        .order("entry_number", { ascending: true });
      if (playersRes.error) {
        showMessage("error", `Error loading players: ${playersRes.error.message}`);
      }
      setPlayers((playersRes.data || []) as SurvivorPlayer[]);
    },
    [showMessage]
  );

  const fetchMatches = useCallback(
    async (roundId: string) => {
      if (!roundId) {
        setMatches([]);
        return;
      }
      const { data, error } = await supabase
        .from("survivor_round_matches")
        .select("*")
        .eq("round_id", roundId)
        .order("match_time", { ascending: true, nullsFirst: false });

      if (error) {
        showMessage("error", `Error loading matches: ${error.message}`);
        setMatches([]);
      } else {
        const rows = (data || []) as SurvivorMatch[];
        setMatches(rows);
        const initialScores: Record<string, ScoreInput> = {};
        rows.forEach((m) => {
          initialScores[m.id] = {
            home_score: m.home_score !== null ? String(m.home_score) : "",
            away_score: m.away_score !== null ? String(m.away_score) : "",
          };
        });
        setScoreInputs(initialScores);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  useEffect(() => {
    fetchPoolData(selectedPoolId);
    setSelectedRoundId("");
    setMatches([]);
  }, [selectedPoolId, fetchPoolData]);

  useEffect(() => {
    fetchMatches(selectedRoundId);
  }, [selectedRoundId, fetchMatches]);

  // ---------------------------------------------------------------- actions
  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("survivor_pools")
        .insert({
          name: newName.trim(),
          entry_fee: parseFloat(newFee) || 100,
          rake_pct: parseFloat(newRake) || 0,
          max_entries_per_user: parseInt(newMaxEntries, 10) || 1,
          closes_at: newClosesAt ? new Date(newClosesAt).toISOString() : null,
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;

      showMessage("success", `Pool "${data.name}" created and OPEN for entries.`);
      setNewName("");
      setNewClosesAt("");
      await fetchPools();
      setSelectedPoolId(data.id);
    } catch (err: any) {
      showMessage("error", `Failed to create pool: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoolStatus = async (newStatus: string) => {
    if (!selectedPoolId) return;
    setLoading(true);
    const { error } = await supabase
      .from("survivor_pools")
      .update({ status: newStatus })
      .eq("id", selectedPoolId);

    if (error) {
      showMessage("error", `Failed to update status: ${error.message}`);
    } else {
      showMessage("success", `Pool status changed to ${newStatus.toUpperCase()}`);
      await fetchPools();
    }
    setLoading(false);
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId) return;

    const nextNumber =
      rounds.length > 0 ? Math.max(...rounds.map((r) => r.round_number)) + 1 : 1;
    if (!newRoundClosesAt) {
      showMessage("error", "Pick a deadline for the round.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("survivor_rounds")
        .insert({
          pool_id: selectedPoolId,
          round_number: nextNumber,
          closes_at: new Date(newRoundClosesAt).toISOString(),
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;
      showMessage("success", `Round ${nextNumber} created.`);
      setNewRoundClosesAt("");
      await fetchPoolData(selectedPoolId);
      setSelectedRoundId(data.id);
    } catch (err: any) {
      showMessage("error", `Failed to create round: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoundStatus = async (newStatus: string) => {
    if (!selectedRoundId) return;
    setLoading(true);
    const { error } = await supabase
      .from("survivor_rounds")
      .update({ status: newStatus })
      .eq("id", selectedRoundId);

    if (error) {
      showMessage("error", `Failed to update round: ${error.message}`);
    } else {
      showMessage("success", `Round status changed to ${newStatus.toUpperCase()}`);
      await fetchPoolData(selectedPoolId);
    }
    setLoading(false);
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoundId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("survivor_round_matches").insert({
        round_id: selectedRoundId,
        home_team: newHome.trim(),
        away_team: newAway.trim(),
        match_time: newMatchTime ? new Date(newMatchTime).toISOString() : null,
        event_id: newEventId ? parseInt(newEventId, 10) : null,
        status: "pending",
      });

      if (error) throw error;
      showMessage("success", `Fixture added: ${newHome} vs ${newAway}`);
      setNewHome("");
      setNewAway("");
      setNewMatchTime("");
      setNewEventId("");
      await fetchMatches(selectedRoundId);
    } catch (err: any) {
      showMessage("error", `Failed to add match: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async (match: SurvivorMatch) => {
    const scoreData = scoreInputs[match.id];
    if (!scoreData || scoreData.home_score === "" || scoreData.away_score === "") {
      showMessage("error", "Please provide both home and away scores.");
      return;
    }

    const homeScore = parseInt(scoreData.home_score, 10);
    const awayScore = parseInt(scoreData.away_score, 10);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showMessage("error", "Scores must be valid numbers (0 or higher).");
      return;
    }

    let outcome: "HOME" | "DRAW" | "AWAY" = "DRAW";
    if (homeScore > awayScore) outcome = "HOME";
    if (awayScore > homeScore) outcome = "AWAY";

    setLoading(true);
    const { error } = await supabase
      .from("survivor_round_matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        outcome,
        status: "finished",
      })
      .eq("id", match.id);

    if (error) {
      showMessage("error", `Error updating score: ${error.message}`);
    } else {
      showMessage("success", `Result saved: ${homeScore}-${awayScore} (${outcome})`);
      await fetchMatches(selectedRoundId);
    }
    setLoading(false);
  };

  const handleVoidMatch = async (match: SurvivorMatch) => {
    if (!window.confirm(`Void ${match.home_team} vs ${match.away_team}? Picks on it will be graded PUSH.`)) return;
    setLoading(true);
    const { error } = await supabase
      .from("survivor_round_matches")
      .update({ status: "void" })
      .eq("id", match.id);

    if (error) {
      showMessage("error", `Error voiding match: ${error.message}`);
    } else {
      showMessage("success", "Match voided.");
      await fetchMatches(selectedRoundId);
    }
    setLoading(false);
  };

  const handleSettleRound = async () => {
    if (!selectedRoundId) return;
    if (
      !window.confirm(
        "Settle this round? All fixtures must be finished or voided first. Losers and players who did not pick will be ELIMINATED (unless everyone loses — all-survive rule)."
      )
    )
      return;

    setLoading(true);
    const { data, error } = await supabase.rpc("settle_survivor_round", {
      p_round_id: selectedRoundId,
    });

    if (error) {
      showMessage("error", `Settlement failed: ${error.message}`);
    } else {
      const res = String(data);
      if (res.startsWith("SETTLED")) {
        showMessage("success", res);
      } else {
        // e.g. NOT_AUTHORIZED / ALREADY_SETTLED / MATCHES_PENDING
        showMessage("error", `Cannot settle: ${res}`);
      }
      await fetchPoolData(selectedPoolId);
    }
    setLoading(false);
  };

  const handleAwardPot = async () => {
    if (!selectedPoolId) return;
    if (
      !window.confirm(
        forceSplit
          ? "Award the pot SPLIT evenly between all surviving entries?"
          : "Award the pot to the last surviving entry?"
      )
    )
      return;

    setLoading(true);
    const { data, error } = await supabase.rpc("payout_survivor_pool", {
      p_pool_id: selectedPoolId,
      p_force_split: forceSplit,
    });

    if (error) {
      showMessage("error", `Payout failed: ${error.message}`);
    } else {
      const res = String(data);
      if (res.startsWith("PAID")) {
        showMessage("success", res);
      } else {
        // e.g. NOT_AUTHORIZED / ALREADY_SETTLED / NO_SURVIVORS / MULTIPLE_SURVIVORS
        showMessage("error", `Cannot award pot: ${res}`);
      }
      await fetchPools();
      await fetchPoolData(selectedPoolId);
    }
    setLoading(false);
  };

  // ---------------------------------------------------------------- derived
  const selectedPool = pools.find((p) => p.id === selectedPoolId) || null;
  const selectedRound = rounds.find((r) => r.id === selectedRoundId) || null;
  const potTotal = players.reduce((sum, p) => sum + Number(p.entry_fee || 0), 0);
  const aliveCount = players.filter((p) => p.alive).length;
  const prizePot =
    potTotal * (1 - Number(selectedPool?.rake_pct ?? 0) / 100);

  const sectionStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "30px",
  };
  const btnStyle = (color: string): React.CSSProperties => ({
    padding: "8px 16px",
    backgroundColor: color,
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: "8px",
  });
  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px" };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Survivor Admin</h1>

      {message.text && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "4px",
            color: "#fff",
            backgroundColor: message.type === "error" ? "#d32f2f" : "#2e7d32",
          }}
        >
          {message.text}
        </div>
      )}

      {/* --- SECTION 1: CREATE POOL --- */}
      <section style={sectionStyle}>
        <h2>1. Create Survivor Pool</h2>
        <form onSubmit={handleCreatePool}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Pool Name</label>
              <input
                type="text"
                required
                placeholder="e.g. EPL Survivor — November"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Entry Fee (KSh)</label>
              <input type="number" min="0" required value={newFee} onChange={(e) => setNewFee(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Rake %</label>
              <input type="number" min="0" max="50" step="0.5" required value={newRake} onChange={(e) => setNewRake(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Max Entries / User</label>
              <input type="number" min="1" max="5" required value={newMaxEntries} onChange={(e) => setNewMaxEntries(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Entries Close At</label>
              <input type="datetime-local" value={newClosesAt} onChange={(e) => setNewClosesAt(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={btnStyle("#1976d2")}>
            {loading ? "Creating..." : "Create & Open Pool"}
          </button>
        </form>
      </section>

      {/* --- SECTION 2: SELECT POOL + STATUS --- */}
      <section style={sectionStyle}>
        <h2>2. Manage Pool</h2>
        <select
          value={selectedPoolId}
          onChange={(e) => setSelectedPoolId(e.target.value)}
          style={{ ...inputStyle, maxWidth: "420px", marginBottom: "15px" }}
        >
          <option value="">— Select a pool —</option>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.status}) — KSh {Number(p.entry_fee).toFixed(0)} fee
            </option>
          ))}
        </select>

        {selectedPool && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <b>Status controls:</b>{" "}
              {["draft", "open", "closed", "settled"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdatePoolStatus(s)}
                  disabled={loading || selectedPool.status === s}
                  style={{
                    ...btnStyle(selectedPool.status === s ? "#455a64" : "#607d8b"),
                    marginRight: "8px",
                    opacity: selectedPool.status === s ? 1 : 0.75,
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ background: "#f5f5f5", borderRadius: "8px", padding: "15px" }}>
              <b>Pot overview:</b> Collected <b>KSh {potTotal.toFixed(2)}</b> · Prize pool{" "}
              <b>KSh {prizePot.toFixed(2)}</b> · Rake{" "}
              <b>KSh {(potTotal - prizePot).toFixed(2)}</b> · Entries{" "}
              <b>{players.length}</b> · Alive <b>{aliveCount}</b>
            </div>
          </>
        )}
      </section>

      {/* --- SECTION 3: ROUNDS --- */}
      <section style={sectionStyle}>
        <h2>3. Rounds</h2>
        {selectedPool ? (
          <>
            <form onSubmit={handleAddRound} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px", flexWrap: "wrap" }}>
              <b>Next round: Round {rounds.length + 1}</b>
              <input
                type="datetime-local"
                required
                value={newRoundClosesAt}
                onChange={(e) => setNewRoundClosesAt(e.target.value)}
                style={{ ...inputStyle, maxWidth: "260px" }}
              />
              <button type="submit" disabled={loading} style={btnStyle("#1976d2")}>
                Add Round
              </button>
            </form>

            {rounds.length > 0 && (
              <select
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                style={{ ...inputStyle, maxWidth: "420px" }}
              >
                <option value="">— Select a round to manage —</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.round_number} ({r.status}) — closes {new Date(r.closes_at).toLocaleString()}
                  </option>
                ))}
              </select>
            )}
          </>
        ) : (
          <p>Select a pool first.</p>
        )}
      </section>

      {/* --- SECTION 4: MATCHES OF SELECTED ROUND --- */}
      {selectedRound && (
        <section style={sectionStyle}>
          <h2>
            4. Round {selectedRound.round_number} Fixtures{" "}
            <span style={{ fontSize: "0.8em", color: "#666" }}>({selectedRound.status})</span>
          </h2>

          <div style={{ marginBottom: "15px" }}>
            <b>Round controls:</b>{" "}
            <button
              onClick={() => handleUpdateRoundStatus("closed")}
              disabled={loading || selectedRound.status !== "open"}
              style={btnStyle("#f57c00")}
            >
              LOCK PICKS
            </button>
            <button
              onClick={() => handleUpdateRoundStatus("open")}
              disabled={loading || selectedRound.status === "settled"}
              style={btnStyle("#2e7d32")}
            >
              RE-OPEN PICKS
            </button>
            <button
              onClick={handleSettleRound}
              disabled={loading || selectedRound.status === "settled"}
              style={btnStyle("#d32f2f")}
            >
              SETTLE ROUND
            </button>
            <span style={{ fontSize: "0.8em", color: "#555" }}>
              (Settle after entering all results. Losers + no-shows are eliminated; if everyone loses, all survive.)
            </span>
          </div>

          {matches.length === 0 ? (
            <p>No fixtures in this round yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "8px" }}>Match</th>
                  <th style={{ padding: "8px" }}>Kick-off</th>
                  <th style={{ padding: "8px" }}>Scores</th>
                  <th style={{ padding: "8px" }}>Outcome</th>
                  <th style={{ padding: "8px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>
                      <b>{m.home_team}</b> vs <b>{m.away_team}</b>
                      <div style={{ fontSize: "0.75em", color: "#888" }}>
                        {m.status}
                        {m.event_id ? ` · event #${m.event_id}` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "8px", fontSize: "0.85em" }}>
                      {m.match_time ? new Date(m.match_time).toLocaleString() : "TBD"}
                    </td>
                    <td style={{ padding: "8px", width: "130px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="H"
                          value={scoreInputs[m.id]?.home_score ?? ""}
                          onChange={(e) =>
                            setScoreInputs((prev) => ({
                              ...prev,
                              [m.id]: { ...prev[m.id], home_score: e.target.value },
                            }))
                          }
                          style={{ width: "55px", padding: "6px" }}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="A"
                          value={scoreInputs[m.id]?.away_score ?? ""}
                          onChange={(e) =>
                            setScoreInputs((prev) => ({
                              ...prev,
                              [m.id]: { ...prev[m.id], away_score: e.target.value },
                            }))
                          }
                          style={{ width: "55px", padding: "6px" }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "8px" }}>
                      {m.outcome ? (
                        <b>{m.outcome}</b>
                      ) : (
                        <span style={{ color: "#999" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                      <button onClick={() => handleSaveResult(m)} disabled={loading} style={btnStyle("#1976d2")}>
                        Save result
                      </button>
                      {m.status !== "void" && (
                        <button onClick={() => handleVoidMatch(m)} disabled={loading} style={btnStyle("#757575")}>
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form onSubmit={handleAddMatch} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Home Team</label>
              <input type="text" required value={newHome} onChange={(e) => setNewHome(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Away Team</label>
              <input type="text" required value={newAway} onChange={(e) => setNewAway(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Kick-off</label>
              <input type="datetime-local" value={newMatchTime} onChange={(e) => setNewMatchTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Event ID (optional)</label>
              <input type="number" value={newEventId} onChange={(e) => setNewEventId(e.target.value)} style={inputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ ...btnStyle("#1976d2"), height: "38px" }}>
              Add
            </button>
          </form>
        </section>
      )}

      {/* --- SECTION 5: PAYOUT --- */}
      {selectedPool && (
        <section style={sectionStyle}>
          <h2>5. Award The Pot</h2>
          <p>
            Alive entries: <b>{aliveCount}</b> · Prize pool:{" "}
            <b>KSh {prizePot.toFixed(2)}</b>
          </p>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={forceSplit}
              onChange={(e) => setForceSplit(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Split the pot evenly between all surviving entries (use when multiple players are still standing at the end)
          </label>
          <button onClick={handleAwardPot} disabled={loading || aliveCount === 0} style={btnStyle("#2e7d32")}>
            {loading ? "Paying..." : "AWARD POT"}
          </button>
          <span style={{ fontSize: "0.8em", color: "#555", marginLeft: "10px" }}>
            Credits each survivor's wallet instantly. Pool is marked SETTLED. Rake stays on the platform.
          </span>
        </section>
      )}
    </div>
  );
}
