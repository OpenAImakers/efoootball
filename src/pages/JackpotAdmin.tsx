import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import UpdateJackpotMatches, {
  Jackpot,
  JackpotGame,
  ScoreInput,
} from "./UpdateJackpotMatches";

type JackpotName = "Rankings 5" | "Rankings 6" | "Rankings 7";

interface NewGameInput {
  game_number: number;
  home_team: string;
  away_team: string;
  match_time: string;
}

interface FlashMessage {
  type: "success" | "error" | "";
  text: string;
}

// Preset mapping matching fixed names to fee, game count, and automatic prize amount
const JACKPOT_PRESETS: Record<
  JackpotName,
  { fee: number; gameCount: number; prize: number }
> = {
  "Rankings 5": { fee: 25, gameCount: 5, prize: 2500 },
  "Rankings 6": { fee: 30, gameCount: 6, prize: 5000 },
  "Rankings 7": { fee: 50, gameCount: 7, prize: 10000 },
};

export default function JackpotAdmin() {
  const [jackpots, setJackpots] = useState<Jackpot[]>([]);
  const [selectedJackpotId, setSelectedJackpotId] = useState<string>("");
  const [selectedJackpot, setSelectedJackpot] = useState<Jackpot | null>(null);
  const [games, setGames] = useState<JackpotGame[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<FlashMessage>({ type: "", text: "" });

  // --- Form State: Create Jackpot ---
  const [newName, setNewName] = useState<JackpotName>("Rankings 5");
  const [newPrizeAmount, setNewPrizeAmount] = useState<string>("2500");
  const [newStartsAt, setNewStartsAt] = useState<string>("");
  const [newClosesAt, setNewClosesAt] = useState<string>("");

  const [newGames, setNewGames] = useState<NewGameInput[]>(
    Array.from({ length: 5 }, (_, i) => ({
      game_number: i + 1,
      home_team: "",
      away_team: "",
      match_time: "",
    }))
  );

  // --- Form State: Score Inputs ---
  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInput>>({});

  useEffect(() => {
    fetchJackpots();
  }, []);

  useEffect(() => {
    if (selectedJackpotId) {
      const jackpot = jackpots.find((j) => j.id === selectedJackpotId);
      setSelectedJackpot(jackpot || null);
      fetchGames(selectedJackpotId);
    } else {
      setSelectedJackpot(null);
      setGames([]);
    }
  }, [selectedJackpotId, jackpots]);

  // Handle tier switch (Auto-populates Prize Amount)
  const handleNameChange = (name: JackpotName) => {
    setNewName(name);
    const preset = JACKPOT_PRESETS[name];

    setNewPrizeAmount(String(preset.prize));
    setNewGames(
      Array.from({ length: preset.gameCount }, (_, i) => ({
        game_number: i + 1,
        home_team: "",
        away_team: "",
        match_time: "",
      }))
    );
  };

  const fetchJackpots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jackpots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("error", `Error loading jackpots: ${error.message}`);
    } else {
      setJackpots(data || []);
      if (data && data.length > 0 && !selectedJackpotId) {
        setSelectedJackpotId(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchGames = async (jackpotId: string) => {
    const { data, error } = await supabase
      .from("jackpot_games")
      .select("*")
      .eq("jackpot_id", jackpotId)
      .order("game_number", { ascending: true });

    if (error) {
      showMessage("error", `Error loading games: ${error.message}`);
    } else {
      setGames(data || []);
      const initialScores: Record<string, ScoreInput> = {};
      (data || []).forEach((g: JackpotGame) => {
        initialScores[g.id] = {
          home_score: g.home_score !== null ? String(g.home_score) : "",
          away_score: g.away_score !== null ? String(g.away_score) : "",
        };
      });
      setScoreInputs(initialScores);
    }
  };

  const handleGameRowChange = (index: number, field: keyof NewGameInput, value: string) => {
    const updated = [...newGames];
    updated[index] = { ...updated[index], [field]: value };
    setNewGames(updated);
  };

  const handleCreateJackpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const preset = JACKPOT_PRESETS[newName];
      const prize = newPrizeAmount ? parseFloat(newPrizeAmount) : preset.prize;

      const { data: jackpotData, error: jackpotError } = await supabase
        .from("jackpots")
        .insert({
          name: newName,
          entry_fee: preset.fee,
          game_count: preset.gameCount,
          prize_amount: prize,
          starts_at: newStartsAt ? new Date(newStartsAt).toISOString() : null,
          closes_at: newClosesAt ? new Date(newClosesAt).toISOString() : null,
          status: "open",
        })
        .select()
        .single();

      if (jackpotError) throw jackpotError;

      const gamesToInsert = newGames.map((g) => ({
        jackpot_id: jackpotData.id,
        game_number: g.game_number,
        home_team: g.home_team,
        away_team: g.away_team,
        match_time: g.match_time ? new Date(g.match_time).toISOString() : null,
        status: "pending",
      }));

      const { error: gamesError } = await supabase
        .from("jackpot_games")
        .insert(gamesToInsert);

      if (gamesError) throw gamesError;

      showMessage(
        "success",
        `${newName} jackpot (Fee: KSh ${preset.fee}, Prize: KSh ${prize}) created successfully!`
      );

      handleNameChange("Rankings 5");
      setNewStartsAt("");
      setNewClosesAt("");

      await fetchJackpots();
      setSelectedJackpotId(jackpotData.id);
    } catch (err: any) {
      showMessage("error", `Failed to create jackpot: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (gameId: string, field: keyof ScoreInput, value: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [field]: value,
      },
    }));
  };

  const handleUpdateGameScore = async (gameId: string) => {
    const scoreData = scoreInputs[gameId];
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
      .from("jackpot_games")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        outcome: outcome,
        status: "finished",
      })
      .eq("id", gameId);

    if (error) {
      showMessage("error", `Error updating score: ${error.message}`);
    } else {
      showMessage("success", `Updated match result to ${homeScore}-${awayScore} (${outcome})`);
      await fetchGames(selectedJackpotId);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (newStatus: "draft" | "open" | "closed" | "settled") => {
    if (!selectedJackpotId) return;
    setLoading(true);

    const { error } = await supabase
      .from("jackpots")
      .update({ status: newStatus })
      .eq("id", selectedJackpotId);

    if (error) {
      showMessage("error", `Failed to update status: ${error.message}`);
    } else {
      showMessage("success", `Jackpot status changed to ${newStatus.toUpperCase()}`);
      await fetchJackpots();
    }
    setLoading(false);
  };

  const handleSettleJackpot = async () => {
    if (!selectedJackpotId) return;
    if (!window.confirm("Are you sure you want to settle this jackpot?")) return;

    setLoading(true);
    const { data, error } = await supabase.rpc("settle_jackpot", {
      p_jackpot_id: selectedJackpotId,
    });

    if (error) {
      showMessage("error", `Settlement failed: ${error.message}`);
    } else {
      showMessage("success", `Jackpot successfully settled! (${data} entries evaluated)`);
      await fetchJackpots();
    }
    setLoading(false);
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Jackpot Admin Dashboard</h1>

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

      {/* --- SECTION 1: CREATE JACKPOT --- */}
      <section style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h2>1. Create Jackpot</h2>
        <form onSubmit={handleCreateJackpot}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                Select Jackpot Tier
              </label>
              <select
                value={newName}
                onChange={(e) => handleNameChange(e.target.value as JackpotName)}
                style={{ width: "100%", padding: "8px" }}
              >
                <option value="Rankings 5">Rankings 5 (KSh 25)</option>
                <option value="Rankings 6">Rankings 6 (KSh 30)</option>
                <option value="Rankings 7">Rankings 7 (KSh 50)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                Prize Amount (KSh)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="2500"
                value={newPrizeAmount}
                onChange={(e) => setNewPrizeAmount(e.target.value)}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                Starts At (Optional)
              </label>
              <input
                type="datetime-local"
                value={newStartsAt}
                onChange={(e) => setNewStartsAt(e.target.value)}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                Closes At Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={newClosesAt}
                onChange={(e) => setNewClosesAt(e.target.value)}
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          </div>

          <h3>Matches ({newGames.length})</h3>
          {newGames.map((game, idx) => (
            <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", minWidth: "30px" }}>#{game.game_number}</span>
              <input
                type="text"
                placeholder="Home Team"
                required
                value={game.home_team}
                onChange={(e) => handleGameRowChange(idx, "home_team", e.target.value)}
                style={{ flex: 2, padding: "8px" }}
              />
              <span>vs</span>
              <input
                type="text"
                placeholder="Away Team"
                required
                value={game.away_team}
                onChange={(e) => handleGameRowChange(idx, "away_team", e.target.value)}
                style={{ flex: 2, padding: "8px" }}
              />
              <input
                type="datetime-local"
                value={game.match_time}
                onChange={(e) => handleGameRowChange(idx, "match_time", e.target.value)}
                style={{ flex: 2, padding: "8px" }}
              />
            </div>
          ))}

          <div style={{ marginTop: "20px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                backgroundColor: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {loading
                ? "Creating..."
                : `Publish ${newName} (KSh ${JACKPOT_PRESETS[newName].fee} / Prize: KSh ${newPrizeAmount})`}
            </button>
          </div>
        </form>
      </section>

      {/* --- SECTION 2: UPDATE MATCH RESULTS & STATUS --- */}
      <UpdateJackpotMatches
        jackpots={jackpots}
        selectedJackpotId={selectedJackpotId}
        setSelectedJackpotId={setSelectedJackpotId}
        selectedJackpot={selectedJackpot}
        games={games}
        scoreInputs={scoreInputs}
        loading={loading}
        onScoreChange={handleScoreChange}
        onUpdateGameScore={handleUpdateGameScore}
        onUpdateStatus={handleUpdateStatus}
        onSettleJackpot={handleSettleJackpot}
      />
    </div>
  );
}