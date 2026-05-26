// components/TournamentsTab.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../supabase";
import { useNavigate } from "react-router-dom";

interface Tournament {
  id: number;
  name: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  tournament_type: string;
  status: "live" | "finished";
  tournament_avatar: string | null;
  first_place_prize: number | null;
  second_place_prize: number | null;
  third_place_prize: number | null;
}

export default function TournamentsTab() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please log in to view your tournaments.");
        return;
      }

      const { data, error: tournamentsError } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          created_at,
          start_time,
          end_time,
          is_active,
          tournament_type,
          status,
          tournament_avatar,
          first_place_prize,
          second_place_prize,
          third_place_prize
        `)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (tournamentsError) throw tournamentsError;
      
      setTournaments(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load tournaments");
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
    
    // Set up real-time subscription for tournaments
    const channel = supabase
      .channel('tournaments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments'
        },
        () => {
          // Refresh tournaments when any change occurs
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTournaments]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === "finished") {
      return <span className="badge bg-secondary">Finished</span>;
    }
    if (isActive) {
      return <span className="badge bg-success">Live</span>;
    }
    return <span className="badge bg-warning text-dark">Upcoming</span>;
  };

  const getTournamentTypeIcon = (type: string) => {
    switch (type) {
      case "single_elimination":
        return "🏆";
      case "double_elimination":
        return "🥇🥈";
      case "round_robin_single":
        return "🔄";
      case "round_robin_double":
        return "🔄🔄";
      default:
        return "🎮";
    }
  };

  const getTournamentTypeName = (type: string) => {
    switch (type) {
      case "single_elimination":
        return "Single Elimination";
      case "double_elimination":
        return "Double Elimination";
      case "round_robin_single":
        return "Round Robin (Single)";
      case "round_robin_double":
        return "Round Robin (Double)";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading tournaments...</span>
        </div>
        <p className="mt-2 text-muted">Loading your tournaments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h5 className="text-muted border-bottom pb-2 mb-3">Tournaments Created</h5>
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <button 
          className="btn btn-outline-primary btn-sm mt-2" 
          onClick={fetchTournaments}
        >
          <i className="bi bi-arrow-repeat me-1"></i>
          Try Again
        </button>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div>
        <h5 className="text-muted border-bottom pb-2 mb-3">Tournaments Created</h5>
        <div className="text-center py-5 text-muted">
          <i className="bi bi-trophy fs-1 opacity-25"></i>
          <p className="mt-2">No tournaments created yet</p>
          <div className="mt-3">
            <button
              onClick={() => navigate("/registrations")}
              className="btn btn-link text-primary text-decoration-none fw-semibold p-0"
              style={{ 
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "none"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(5px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              Create a registration
              <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: "1.2rem" }}></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h5 className="text-muted border-bottom pb-2 mb-3">
        Tournaments Created
        <span className="badge bg-primary ms-2">{tournaments.length}</span>
      </h5>
      
      <div className="row g-3">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="col-12">
            <div className="card border-0 shadow-sm hover-card" style={{ borderRadius: "12px", transition: "all 0.2s ease" }}>
              <div className="card-body">
                <div className="row align-items-center">
                  {/* Tournament Avatar/Icon */}
                  <div className="col-auto">
                    {tournament.tournament_avatar ? (
                      <img 
                        src={tournament.tournament_avatar} 
                        alt={tournament.name}
                        className="rounded-circle"
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                    ) : (
                      <div 
                        className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "50px", height: "50px", fontSize: "1.5rem" }}
                      >
                        {getTournamentTypeIcon(tournament.tournament_type)}
                      </div>
                    )}
                  </div>
                  
                  {/* Tournament Info */}
                  <div className="col">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h6 className="fw-bold mb-0">{tournament.name}</h6>
                      {getStatusBadge(tournament.status, tournament.is_active)}
                    </div>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                      <span>
                        <i className="bi bi-calendar3 me-1"></i>
                        Created: {formatDate(tournament.created_at)}
                      </span>
                      {tournament.start_time && (
                        <span>
                          <i className="bi bi-play-circle me-1"></i>
                          Starts: {formatDate(tournament.start_time)}
                        </span>
                      )}
                      {tournament.end_time && (
                        <span>
                          <i className="bi bi-flag me-1"></i>
                          Ends: {formatDate(tournament.end_time)}
                        </span>
                      )}
                      <span>
                        <i className="bi bi-trophy me-1"></i>
                        {getTournamentTypeName(tournament.tournament_type)}
                      </span>
                    </div>
                    
                    {/* Prize Info */}
                    {(tournament.first_place_prize || tournament.second_place_prize || tournament.third_place_prize) && (
                      <div className="mt-2 d-flex gap-3 small">
                        {tournament.first_place_prize && (
                          <span className="text-warning">
                            <i className="bi bi-trophy-fill me-1"></i>
                            1st: ${tournament.first_place_prize}
                          </span>
                        )}
                        {tournament.second_place_prize && (
                          <span className="text-secondary">
                            <i className="bi bi-trophy me-1"></i>
                            2nd: ${tournament.second_place_prize}
                          </span>
                        )}
                        {tournament.third_place_prize && (
                          <span className="text-secondary">
                            <i className="bi bi-trophy me-1"></i>
                            3rd: ${tournament.third_place_prize}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="col-auto">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/tournaments/${tournament.id}`)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        View
                      </button>
                      {tournament.status === "live" && (
                        <button 
                          className="btn btn-sm btn-outline-success"
                          onClick={() => navigate(`/tournaments/${tournament.id}/manage`)}
                        >
                          <i className="bi bi-gear me-1"></i>
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  );
}