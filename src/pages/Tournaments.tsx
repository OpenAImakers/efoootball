"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase";

const CACHE_KEY = "tournament_list_cache";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minutes

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"live" | "finished">("live");
  
    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Initial Cache on Mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      if (data) setTournaments(data);
    }
  }, []);

  const fetchTournaments = useCallback(async (currentUser: any, isSilent = false) => {
    if (!isSilent) setLoading(true);
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

      const mapped = tData.map((t) => {
        const first = parseFloat(t.first_place_prize) || 0;
        const second = parseFloat(t.second_place_prize) || 0;
        const third = parseFloat(t.third_place_prize) || 0;
        const totalBudget = first + second + third;

        return {
          ...t,
          total_budget: totalBudget,
          follower_count: t.tournament_followers?.length || 0,
          isFollowing: t.tournament_followers?.some(
            (f: any) => f.user_id === currentUser?.id
          ),
          host_name: idToDisplay[t.created_by] || "System",
        };
      });

      setTournaments(mapped);
      
      // Update Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: mapped,
        timestamp: Date.now()
      }));

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

      // Set up 5-minute auto-refresh
      refreshTimer.current = setInterval(() => {
        fetchTournaments(data.user, true);
      }, REFRESH_INTERVAL);
    };
    
    init();

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchTournaments]);

  const handleFollow = async (tournamentId: number, isFollowing: boolean) => {
    if (!user) {
      alert("Please log in to follow tournaments!");
      return;
    }

    // Optimistic Update
    const updatedTournaments = tournaments.map((t) =>
      t.id === tournamentId
        ? {
            ...t,
            isFollowing: !isFollowing,
            follower_count: t.follower_count + (isFollowing ? -1 : 1),
          }
        : t
    );
    
    setTournaments(updatedTournaments);
    
    // Update cache immediately so state persists on refresh
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: updatedTournaments,
      timestamp: Date.now()
    }));

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
      // Revert on error could be added here, but keep it simple as requested
    }
  };

  const filtered = tournaments
    .filter((t) =>
      t.name?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((t) => t.status === statusFilter);

  return (
    <div
      className="min-vh-100 w-100"
      style={{ backgroundColor: "#020617", color: "#f8fafc" }}
    >
      <div className="w-100 py-4">
        {/* Search */}
        <div className="mb-4 px-3">
          <input
            type="text"
            className="form-control bg-transparent border-0 text-white shadow-none p-0"
            placeholder="SEARCH TOURNAMENTS..."
            style={{
              fontSize: "clamp(1.2rem, 5vw, 1.5rem)",
              fontWeight: 900,
              fontStyle: "italic",
              borderLeft: "6px solid #ffffff",
              paddingLeft: "1.25rem",
              letterSpacing: "1.5px",
              width: "100%",
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="d-flex gap-2 px-3 mb-4">
          <button
            className={`btn ${
              statusFilter === "live"
                ? "btn-primary"
                : "btn-outline-light"
            }`}
            onClick={() => setStatusFilter("live")}
          >
            Live
          </button>

          <button
            className={`btn ${
              statusFilter === "finished"
                ? "btn-primary"
                : "btn-outline-light"
            }`}
            onClick={() => setStatusFilter("finished")}
          >
            Finished
          </button>
        </div>

        {loading && tournaments.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-secondary py-5">
            No {statusFilter} tournaments found.
          </div>
        ) : (
          <div className="w-100">
            {filtered.map((t) => (
              <div key={t.id} className="w-100 mb-3 px-3">
                <div
                  className="card border-0 shadow-lg overflow-hidden w-100"
                  style={{
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                >
                  <div className="row g-0 w-100 m-0">

                    {/* Image */}
                    <div className="col-12 col-md-3 col-lg-2 p-0">
                      <div
                        className="w-100"
                        style={{
                          minHeight: "200px",
                          height: "100%",
                          backgroundImage: `url(${
                            t.tournament_avatar ||
                            "https://via.placeholder.com/400x250?text=Arena"
                          })`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="col-12 col-md-6 col-lg-7 p-3 p-md-4 d-flex flex-column justify-content-center">

                      {/* Status Badge */}
                      <div className="mb-2">
                        <span
                          className={`badge px-3 py-2 ${
                            t.status === "live"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                          style={{ fontSize: "0.7rem", fontWeight: 600 }}
                        >
                          {t.status?.toUpperCase()}
                        </span>
                      </div>

                      <span className="text-info fw-bold font-monospace mb-2" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>
                        {t.tournament_type
                          ?.replace(/_/g, " ")
                          .toUpperCase() || "TOURNAMENT"}
                      </span>

                      <h3 className="h4 fw-black text-white mb-3 text-uppercase" style={{ fontWeight: 900 }}>
                        {t.name}
                      </h3>

                      <div className="d-flex flex-wrap gap-4 mb-3">
                        <div>
                          <span className="text-secondary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>
                            START
                          </span>
                          <div className="fw-semibold" style={{ fontSize: "0.85rem" , color: "#ffffff" }}>
                            {t.start_time
                              ? new Date(
                                  t.start_time
                                ).toLocaleDateString()
                              : "TBD"}
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>
                            END
                          </span>
                          <div className="fw-semibold " style={{ fontSize: "0.85rem" , color: t.end_time && new Date(t.end_time) < new Date() ? "#ef4444" : "#ffffff"}}>
                            {t.end_time
                              ? new Date(
                                  t.end_time
                                ).toLocaleDateString()
                              : "TBD"}
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>
                            HOST
                          </span>
                          <div className="fw-semibold" style={{ color: "#a5b4fc", fontSize: "0.85rem" }}>
                            {t.host_name}
                          </div>
                        </div>
                      </div>

                      {/* Prizes Section */}
                      <div className="d-flex flex-wrap gap-4 mb-3">
                        <div>
                          <span className="text-secondary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>1ST</span>
                          <div className="text-warning fw-bold" style={{ fontSize: "1.1rem" }}>
                            KSH {t.first_place_prize ? parseFloat(t.first_place_prize).toLocaleString() : "00"}
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>2ND</span>
                          <div className="text-light fw-bold" style={{ fontSize: "1.1rem" }}>
                            KSH {t.second_place_prize ? parseFloat(t.second_place_prize).toLocaleString() : "00"}
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>3RD</span>
                          <div className="text-danger fw-bold" style={{ fontSize: "1.1rem" }}>
                            KSH {t.third_place_prize ? parseFloat(t.third_place_prize).toLocaleString() : "00"}
                          </div>
                        </div>
                      </div>

                      {/* TOTAL BUDGET PER TOURNAMENT */}
                      <div
                        className="mt-2 p-3 rounded"
                        style={{
                          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                          borderLeft: "4px solid #fbbf24",
                          borderRight: "1px solid #334155",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                letterSpacing: "2px",
                                fontWeight: 700,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                              }}
                            >
                              Total Budget
                            </span>
                            <div
                              style={{
                                fontSize: "1.5rem",
                                fontWeight: 900,
                                color: "#fbbf24",
                                lineHeight: 1.2,
                              }}
                            >
                              KSH {t.total_budget.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-12 col-md-3 p-3 p-md-4 d-flex flex-column align-items-start justify-content-between gap-3">
                      <div>
                        <span className="text-primary" style={{ fontSize: "0.65rem", letterSpacing: "1px" }}>
                          FOLLOWERS
                        </span>
                        <div className="fw-bold text-primary" style={{ fontSize: "1.3rem" }}>
                          {t.follower_count}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleFollow(t.id, t.isFollowing)
                        }
                        className={`btn ${
                          t.isFollowing
                            ? "btn-secondary"
                            : "btn-light"
                        } w-100 py-2`}
                        style={{ fontWeight: 600 }}
                      >
                        {t.isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList;