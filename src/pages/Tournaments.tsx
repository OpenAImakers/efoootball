"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  const fetchTournaments = useCallback(async (currentUser: any) => {
    setLoading(true);
    try {
      const { data: tData, error: tError } = await supabase
        .from("tournaments")
        .select("*, tournament_followers(user_id)")
        .order("created_at", { ascending: false });

      if (tError) throw tError;

      const hostIds = Array.from(
        new Set(tData.map((t) => t.created_by).filter(Boolean))
      );

      let idToDisplay: Record<string, string> = {};

      if (hostIds.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", hostIds);

        idToDisplay = Object.fromEntries(
          pData?.map((p) => [p.id, p.display_name]) || []
        );
      }

      const mapped = tData.map((t) => ({
        ...t,
        follower_count: t.tournament_followers?.length || 0,
        isFollowing: t.tournament_followers?.some((f: any) => f.user_id === currentUser?.id),
        host_name: idToDisplay[t.created_by] || "System",
      }));

      setTournaments(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      fetchTournaments(data.user);
    };
    init();
  }, [fetchTournaments]);

  const handleFollow = async (tournamentId: number, isFollowing: boolean) => {
    if (!user) {
      alert("Please log in to follow tournaments!");
      return;
    }

    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              isFollowing: !isFollowing,
              follower_count: t.follower_count + (isFollowing ? -1 : 1),
            }
          : t
      )
    );

    try {
      if (isFollowing) {
        await supabase
          .from("tournament_followers")
          .delete()
          .eq("tournament_id", tournamentId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("tournament_followers")
          .insert({ tournament_id: tournamentId, user_id: user.id });
      }
    } catch (err) {
      console.error("Follow action failed:", err);
    }
  };

  const filtered = tournaments.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-vh-100 w-100" style={{ backgroundColor: "#020617", color: "#f8fafc" }}>
      <div className="container-fluid container-lg py-4">

        {/* Search bar wrapper - ensure no horizontal scroll */}
        <div className="mb-5 px-2">
          <input
            type="text"
            className="form-control bg-transparent border-0 text-white shadow-none p-0"
            placeholder="SEARCH TOURNAMENTS..."
            style={{
              fontSize: "clamp(1.2rem, 5vw, 1.5rem)", // Fluid font size
              fontWeight: 900,
              fontStyle: "italic",
              borderLeft: "6px solid #ffffff",
              paddingLeft: "1.25rem",
              letterSpacing: "1.5px",
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && tournaments.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-3 mx-0"> {/* Row handles the gap and ensures full width */}
            {filtered.map((t) => (
              <div key={t.id} className="col-12 px-0">
                <div
                  className="card border-0 shadow-lg overflow-hidden w-100"
                  style={{
                    backgroundColor: "#0f172a",
                    borderRadius: "4px",
                  }}
                >
                  <div className="row g-0 align-items-stretch">
                    {/* Thumbnail */}
                    <div className="col-12 col-md-3 col-lg-2">
                      <div
                        className="h-100 w-100"
                        style={{
                          minHeight: "160px",
                          backgroundImage: `url(${t.tournament_avatar || "https://via.placeholder.com/400x250?text=Arena"})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    </div>

                    {/* Main Info */}
                    <div className="col-12 col-md-6 col-lg-7 px-4 py-3 py-md-4 d-flex flex-column justify-content-center">
                      <div className="mb-1">
                        <span
                          className="text-info fw-bold font-monospace"
                          style={{ fontSize: "0.75rem", fontStyle: "italic" }}
                        >
                          {t.tournament_type?.replace(/_/g, " ").toUpperCase() || "TOURNAMENT"}
                        </span>
                      </div>

                      <h3
                        className="h5 fw-black text-white mb-3 text-uppercase text-break"
                        style={{ fontStyle: "italic", letterSpacing: "0.5px" }}
                      >
                        {t.name}
                      </h3>

                      <div className="d-flex flex-wrap gap-3 gap-md-4">
                        <div className="flex-shrink-0">
                          <span className="d-block text-secondary fw-bold extra-small">START</span>
                          <span className="text-white fw-medium small">
                            {t.start_time ? new Date(t.start_time).toLocaleDateString() : "TBD"}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="d-block text-secondary fw-bold extra-small">ENDS</span>
                          <span className="text-white fw-medium small">
                            {t.end_time ? new Date(t.end_time).toLocaleDateString() : "TBD"}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="d-block text-secondary fw-bold extra-small">ORGANIZER</span>
                          <span className="fw-bold small text-break" style={{ color: "#a5b4fc" }}>
                            {t.host_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-12 col-md-3 px-4 py-3 py-md-4 d-flex align-items-center justify-content-between justify-content-md-end gap-4 border-top border-md-top-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-center text-md-end">
                        <span className="d-block text-secondary fw-bold extra-small">FOLLOWERS</span>
                        <span
                          className="text-white fw-black"
                          style={{ fontSize: "1.6rem", lineHeight: 1 }}
                        >
                          {t.follower_count}
                        </span>
                      </div>

                      <button
                        onClick={() => handleFollow(t.id, t.isFollowing)}
                        className={`btn pes-action-btn d-flex align-items-center gap-2 ${t.isFollowing ? "following" : ""}`}
                      >
                        <i
                          className={`bi ${t.isFollowing ? "bi-person-check-fill" : "bi-person-plus"}`}
                          style={{ fontSize: "1.2rem" }}
                        ></i>
                        <span className="action-text">
                          {t.isFollowing ? "Following" : "Follow"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .extra-small {
          font-size: 0.6rem;
          letter-spacing: 1px;
        }

        .pes-action-btn {
          background: #ffffff;
          color: #000000;
          border: none;
          padding: 0.5rem 1.5rem;
          font-weight: 900;
          font-style: italic;
          transition: all 0.2s ease;
          clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
          letter-spacing: 1px;
          font-size: 0.85rem;
          min-width: 130px;
        }

        .pes-action-btn:hover {
          background: #3b82f6;
          color: white;
          transform: translateY(-2px);
        }

        .pes-action-btn.following {
          background: #1e293b;
          color: #94a3b8;
          border: 1px solid #334155;
          clip-path: none;
        }

        .pes-action-btn.following:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.2) !important;
        }

        @media (max-width: 767px) {
          .pes-action-btn {
            min-width: 110px;
            padding: 0.5rem 1rem;
          }
          .action-text {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TournamentList;