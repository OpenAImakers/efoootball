import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

interface Match {
  id: number;
  home_team: { name: string };
  away_team: { name: string };
  stage: string;
}

type VoteOption = "home" | "away" | "draw";

export default function MatchVotePage() {
  const { id } = useParams<{ id: string }>();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState<VoteOption | null>(null);
  const [voting, setVoting] = useState(false);
  
  const [stats, setStats] = useState({ home: 0, away: 0, draw: 0, total: 0 });

  // Memoize fetchVoteStats to satisfy useEffect dependencies
  const fetchVoteStats = useCallback(async () => {
    const { data } = await supabase
      .from("match_votes")
      .select("predicted_winner")
      .eq("match_id", id);

    if (data) {
      const counts = { home: 0, away: 0, draw: 0, total: data.length };
      data.forEach((v) => {
        if (v.predicted_winner === "home") counts.home++;
        if (v.predicted_winner === "away") counts.away++;
        if (v.predicted_winner === "draw") counts.draw++;
      });
      setStats(counts);
    }
  }, [id]);

  // Memoize fetchMatch to satisfy useEffect dependencies
  const fetchMatchAndUserVote = useCallback(async () => {
    const { data: matchData } = await supabase
      .from("matches")
      .select(`id, home_team:home_team_id(name), away_team:away_team_id(name), stage`)
      .eq("id", Number(id))
      .single();

    if (matchData) setMatch(matchData as unknown as Match);

    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { data: voteData } = await supabase
        .from("match_votes")
        .select("predicted_winner")
        .eq("match_id", id)
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (voteData) setSelectedWinner(voteData.predicted_winner as VoteOption);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      await Promise.all([fetchMatchAndUserVote(), fetchVoteStats()]);
      setLoading(false);
    }

    loadData();
  }, [id, fetchMatchAndUserVote, fetchVoteStats]); // All dependencies included

  const handleVote = async (choice: VoteOption) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return alert("Please log in to vote");

    setVoting(true);
    const { error: insertError } = await supabase.from("match_votes").insert({
      match_id: match?.id,
      user_id: authData.user.id,
      predicted_winner: choice,
    });

    if (!insertError) {
      setSelectedWinner(choice);
      fetchVoteStats(); 
    } else {
        alert(insertError.message);
    }
    setVoting(false);
  };

  const getPercent = (count: number) => 
    stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  if (!match) return <div className="alert alert-warning">Match not found</div>;

  return (
    <>
    <Navbar />
    <div className="container-fluid mt-5 pt-3" style={{ fontFamily: "sans-serif" }}>
      <div className="card shadow border-0 overflow-hidden">
        <div className="card-header bg-dark text-white text-center py-4">
          <h2 className="mb-0 fw-light">Who's your money on?</h2>
          <small className="text-secondary text-uppercase">{match.stage}</small>
        </div>

        <div className="card-body p-4 p-md-5">
          <div className="mb-5">
            <div className="d-flex justify-content-between mb-2 fw-bold small">
              <span>COMMUNITY PREDICTIONS</span>
              <span>{stats.total} Votes</span>
            </div>
            <div className="progress" style={{ height: "35px", borderRadius: "10px" }}>
              <div 
                className="progress-bar bg-primary" 
                style={{ width: `${getPercent(stats.home)}%` }}
              >
                {getPercent(stats.home)}%
              </div>
              <div 
                className="progress-bar bg-secondary" 
                style={{ width: `${getPercent(stats.draw)}%` }}
              >
                {getPercent(stats.draw)}%
              </div>
              <div 
                className="progress-bar bg-danger" 
                style={{ width: `${getPercent(stats.away)}%` }}
              >
                {getPercent(stats.away)}%
              </div>
            </div>
            <div className="d-flex justify-content-between mt-2 small text-muted text-uppercase fw-bold">
              <span>{match.home_team.name}</span>
              <span>Draw</span>
              <span>{match.away_team.name}</span>
            </div>
          </div>

          <div className="row g-3 text-center">
            <div className="col-md-4">
              <button
                className={`btn btn-lg w-100 py-3 ${selectedWinner === "home" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => handleVote("home")}
                disabled={voting || !!selectedWinner}
              >
                {match.home_team.name}
              </button>
            </div>
            <div className="col-md-4">
              <button
                className={`btn btn-lg w-100 py-3 ${selectedWinner === "draw" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => handleVote("draw")}
                disabled={voting || !!selectedWinner}
              >
                Draw
              </button>
            </div>
            <div className="col-md-4">
              <button
                className={`btn btn-lg w-100 py-3 ${selectedWinner === "away" ? "btn-danger" : "btn-outline-danger"}`}
                onClick={() => handleVote("away")}
                disabled={voting || !!selectedWinner}
              >
                {match.away_team.name}
              </button>
            </div>
          </div>

          {selectedWinner && (
            <div className="text-center mt-4">
              <span className="badge bg-success p-2 px-4 fs-6">✓ Prediction Recorded</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}