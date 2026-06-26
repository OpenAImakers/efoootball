"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";

interface ChallengeItem {
  id: number;
  match_id: number;
  creator_id: string;
  creator_pick: "HOME" | "AWAY" | "DRAW";
  challenger_id: string | null;
  stake_amount: number;
  total_pool: number;
  status: "open" | "accepted" | "resolved" | string;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  match_outcome: string | null;
  match: {
    id: number;
    home_goals: number;
    away_goals: number;
    played: boolean;
    stage: string;
    tournament: { name: string };
    home_team: { name: string };
    away_team: { name: string };
  };
}

export default function ChallengesTab() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserChallenges();
  }, []);

  const fetchUserChallenges = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("challenges")
        .select(`
          id,
          match_id,
          creator_id,
          creator_pick,
          challenger_id,
          stake_amount,
          total_pool,
          status,
          created_at,
          accepted_at,
          resolved_at,
          match_outcome,
          match:match_id (
            id,
            home_goals,
            away_goals,
            played,
            stage,
            tournament_id,
            home_team:home_team_id (name),
            away_team:away_team_id (name),
            tournament:tournament_id (name)
          )
        `)
        .or(`creator_id.eq.${user.id},challenger_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChallenges((data || []) as unknown as ChallengeItem[]);
    } catch (err: any) {
      console.error("Error fetching user challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUserPick = (item: ChallengeItem) => {
    const isCreator = item.creator_id === currentUserId;
    if (isCreator) return item.creator_pick;
    if (item.creator_pick === "HOME") return "AWAY";
    if (item.creator_pick === "AWAY") return "HOME";
    return "DRAW";
  };

  const getStatus = (item: ChallengeItem) => {
    if (item.status === "open" || item.status === "accepted") {
      return { label: "RUNNING", color: "bg-warning text-dark" };
    }
    const userPick = getUserPick(item);
    const won = userPick === item.match_outcome;
    return {
      label: won ? "WON" : "LOST",
      color: won ? "bg-success" : "bg-danger"
    };
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div>
        <h5 className="fw-bold text-primary mb-4">Your Challenges</h5>
        <div className="text-center py-5 text-muted">
          <i className="bi bi-trophy fs-1 opacity-25"></i>
          <p className="mt-3">No challenges yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-bold text-primary mb-4">Your Challenges</h5>

      <div className="row g-3">
        {challenges.map((item) => {
          const userPick = getUserPick(item);
          const status = getStatus(item);
          const isExpanded = expandedId === item.id;
          const totalPool = Number(item.total_pool || item.stake_amount * 2);

          return (
            <div key={item.id} className="col-12 col-lg-6">
              <div 
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: "14px", cursor: "pointer" }}
                onClick={() => toggleExpand(item.id)}
              >
                <div className="card-body p-3">
                  {/* Status + Pool */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge px-3 py-1 fw-bold ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="fw-bold text-primary">KSh {totalPool.toLocaleString()}</span>
                  </div>

                  {/* Match */}
                  <div className="my-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1 text-truncate">
                        <div className="fw-medium">{item.match?.home_team?.name}</div>
                      </div>
                      <div className="px-3 text-center">
                        <small className="text-muted">VS</small>
                      </div>
                      <div className="flex-grow-1 text-truncate text-end">
                        <div className="fw-medium">{item.match?.away_team?.name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Your Pick */}
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <small className="text-muted">Your Pick</small>
                    <span className="fw-semibold">{userPick}</span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-top small">
                      <div className="row g-2 text-muted">
                        <div className="col-6">
                          <strong>Tournament:</strong><br />
                          {item.match?.tournament?.name}
                        </div>
                        <div className="col-6 text-end">
                          <strong>Stage:</strong><br />
                          {item.match?.stage}
                        </div>
                        <div className="col-12 mt-2">
                          <strong>Challenge Amount:</strong> KSh {item.stake_amount}
                        </div>
                        {item.status === "resolved" && (
                          <div className="col-12 mt-1">
                            <strong>Final Score:</strong> 
                            {item.match?.home_goals} - {item.match?.away_goals}
                          </div>
                        )}
                        <div className="col-12 mt-2 pt-2 border-top">
                          <small>
                            {new Date(item.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-2 text-muted">
                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}