"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";

interface MatchWithPrediction {
  id: number;
  home_team: { name: string };
  away_team: { name: string };
  home_goals: number;
  away_goals: number;
  played: boolean;
  stage: string;
  tournament: { name: string };
  user_prediction: string | null;
  created_at: string;
}

export default function PredictionsTab() {
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchUserPredictions();
  }, []);

  const fetchUserPredictions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all matches with user's predictions
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id,
          home_goals,
          away_goals,
          played,
          stage,
          created_at,
          tournament_id,
          home_team:home_team_id (name),
          away_team:away_team_id (name),
          tournament:tournament_id (name),
          match_votes!left (predicted_winner, user_id)
        `)
        .order("created_at", { ascending: false });

      if (matchesError) throw matchesError;

      // Filter matches where user has predicted
      const userMatches = matchesData
        ?.filter((match: any) => {
          const userVote = match.match_votes?.find(
            (vote: any) => vote.user_id === user.id
          );
          if (userVote) {
            match.user_prediction = userVote.predicted_winner;
            return true;
          }
          return false;
        })
        .map((match: any) => ({
          ...match,
          user_prediction: match.user_prediction
        })) || [];

      setMatches(userMatches);

      // Calculate statistics
      const completedMatches = userMatches.filter(m => m.played === true);
      let correctCount = 0;
      
      completedMatches.forEach(match => {
        let actualWinner = null;
        if (match.home_goals > match.away_goals) actualWinner = "home";
        else if (match.away_goals > match.home_goals) actualWinner = "away";
        else actualWinner = "draw";
        
        if (match.user_prediction === actualWinner) correctCount++;
      });
      
      setStats({
        correct: correctCount,
        total: completedMatches.length,
        percentage: completedMatches.length > 0 
          ? Math.round((correctCount / completedMatches.length) * 100) 
          : 0
      });

    } catch (err: any) {
      console.error("Error fetching predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerText = (winner: string | null, homeTeam: string, awayTeam: string) => {
    if (winner === "home") return homeTeam;
    if (winner === "away") return awayTeam;
    if (winner === "draw") return "Draw";
    return "Not predicted";
  };

  const getActualResult = (match: any) => {
    if (!match.played) return null;
    if (match.home_goals > match.away_goals) return { winner: "home", text: match.home_team?.name };
    if (match.away_goals > match.home_goals) return { winner: "away", text: match.away_team?.name };
    return { winner: "draw", text: "Draw" };
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div>
        <h5 className="fw-bold text-primary mb-4">Your Predictions</h5>
        <div className="text-center py-5 text-muted">
          <i className="bi bi-chat-dots fs-1 opacity-25"></i>
          <p className="mt-2">No predictions made yet</p>
          <small>Your match predictions will appear here after you vote</small>
        </div>
      </div>
    );
  }

  // Separate matches
  const upcomingMatches = matches.filter(m => !m.played);
  const completedMatches = matches.filter(m => m.played);

  return (
    <div>
      <h5 className="fw-bold text-primary mb-4">Your Predictions</h5>
      
      {/* Statistics Card */}
      {stats.total > 0 && (
        <div className="card bg-gradient-primary text-white mb-4 border-0 shadow-sm" style={{ borderRadius: "15px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
          <div className="card-body p-4 text-center">
            <h6 className="text-white-50 mb-2">Your Prediction Accuracy</h6>
            <div className="display-4 fw-bold mb-2">{stats.percentage}%</div>
            <p className="mb-0">{stats.correct} correct out of {stats.total} predictions</p>
          </div>
        </div>
      )}

      {/* Upcoming Matches (Predictions not yet decided) */}
      {upcomingMatches.length > 0 && (
        <div className="mb-5">
          <h6 className="text-muted mb-3">
            <i className="bi bi-clock-history me-2"></i>
            Pending Results ({upcomingMatches.length})
          </h6>
          <div className="row g-3">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="col-12">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-warning text-dark">{match.stage}</span>
                      <small className="text-muted">{match.tournament?.name}</small>
                    </div>
                    
                    <div className="row align-items-center text-center mb-3">
                      <div className="col-5">
                        <h6 className="mb-0">{match.home_team?.name}</h6>
                      </div>
                      <div className="col-2">
                        <span className="fw-bold text-muted">VS</span>
                      </div>
                      <div className="col-5">
                        <h6 className="mb-0">{match.away_team?.name}</h6>
                      </div>
                    </div>

                    <div className="alert alert-info mb-0">
                      <small>
                        <i className="bi bi-check-circle-fill me-2"></i>
                        You predicted: <strong>{getWinnerText(match.user_prediction, match.home_team?.name, match.away_team?.name)}</strong>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches with Results */}
      {completedMatches.length > 0 && (
        <div>
          <h6 className="text-muted mb-3">
            <i className="bi bi-trophy me-2"></i>
            Completed Matches ({completedMatches.length})
          </h6>
          <div className="row g-3">
            {completedMatches.map((match) => {
              const actualResult = getActualResult(match);
              const isCorrect = match.user_prediction === actualResult?.winner;
              
              return (
                <div key={match.id} className="col-12">
                  <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-secondary">{match.stage}</span>
                        <small className="text-muted">{match.tournament?.name}</small>
                      </div>
                      
                      <div className="row align-items-center text-center mb-3">
                        <div className="col-5">
                          <h6 className="mb-0">{match.home_team?.name}</h6>
                          <span className="fw-bold fs-3">{match.home_goals}</span>
                        </div>
                        <div className="col-2">
                          <span className="fw-bold text-muted">VS</span>
                        </div>
                        <div className="col-5">
                          <h6 className="mb-0">{match.away_team?.name}</h6>
                          <span className="fw-bold fs-3">{match.away_goals}</span>
                        </div>
                      </div>

                      <div className={`alert ${isCorrect ? 'alert-success' : 'alert-danger'} mb-0`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <i className={`bi ${isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                            <small>
                              You predicted: <strong>{getWinnerText(match.user_prediction, match.home_team?.name, match.away_team?.name)}</strong>
                            </small>
                          </div>
                          <div>
                            <small className="fw-bold">
                              Actual result: <strong>{actualResult?.text}</strong>
                              {isCorrect && <span className="ms-2 text-success">✓ Correct!</span>}
                              {!isCorrect && <span className="ms-2 text-danger">✗ Wrong</span>}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}