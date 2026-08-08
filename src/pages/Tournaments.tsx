"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase";
import MatchPreviews from "../components/MatchPreviews";

const CACHE_KEY = "tournament_list_cache_public";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minutes

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"live" | "finished">("live");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Initial Cache on Mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        if (data) setTournaments(data);
      } catch (err) {
        console.error("Error reading tournament cache:", err);
      }
    }
  }, []);

  const fetchTournaments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data: tData, error: tError } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (tError) throw tError;

      const hostIds = Array.from(
        new Set(tData?.map((t) => t.created_by).filter(Boolean) || [])
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

      const mapped = (tData || []).map((t) => {
        const first = parseFloat(t.first_place_prize) || 0;
        const second = parseFloat(t.second_place_prize) || 0;
        const third = parseFloat(t.third_place_prize) || 0;
        const totalBudget = first + second + third;

        return {
          ...t,
          total_budget: totalBudget,
          host_name: idToDisplay[t.created_by] || "System",
        };
      });

      setTournaments(mapped);

      // Update Cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: mapped,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error("Error fetching public tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();

    // Set up 5-minute auto-refresh
    refreshTimer.current = setInterval(() => {
      fetchTournaments(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchTournaments]);

  const filtered = tournaments
    .filter((t) => t.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => t.status === statusFilter);

  return (
    <>
      <div className="w-100 py-3">
        {/* Search & Filter Header Bar */}
        <div className="bg-white p-3 rounded-3 shadow-sm border mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-7 col-lg-8">
              <input
                type="text"
                className="form-control bg-light border shadow-none px-3 py-2"
                placeholder="Search tournaments..."
                style={{ fontSize: "0.9rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-5 col-lg-4 d-flex justify-content-md-end gap-2">
              <button
                className={`btn btn-sm flex-fill flex-md-grow-0 px-3 py-1 fw-bold ${
                  statusFilter === "live" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setStatusFilter("live")}
              >
                Live
              </button>
              <button
                className={`btn btn-sm flex-fill flex-md-grow-0 px-3 py-1 fw-bold ${
                  statusFilter === "finished" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setStatusFilter("finished")}
              >
                Finished
              </button>
            </div>
          </div>
        </div>

        {/* Tournament Cards Grid */}
        {loading && tournaments.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-4 text-center text-muted rounded-3 shadow-sm border">
            No {statusFilter} tournaments found.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
            {filtered.map((t) => (
              <div key={t.id} className="col">
                <div className="card h-100 border shadow-sm rounded-3 overflow-hidden bg-white">
                  {/* Compact Image + Title */}
                  <div className="p-3 pb-2 text-center">
                    <div
                      className="d-flex align-items-center justify-content-center bg-light border rounded-2 mb-2 mx-auto"
                      style={{
                        width: "100%",
                        maxWidth: "220px",
                        height: "120px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={
                          t.tournament_avatar ||
                          "https://via.placeholder.com/400x250?text=Arena"
                        }
                        alt={t.name}
                        className="img-fluid rounded-1"
                        style={{
                          maxHeight: "110px",
                          width: "auto",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                      <span
                        className={`badge ${
                          t.status === "live" ? "bg-success" : "bg-secondary"
                        }`}
                        style={{ fontSize: "0.65rem", letterSpacing: "0.3px" }}
                      >
                        {t.status?.toUpperCase()}
                      </span>
                      <span
                        className="text-primary fw-bold font-monospace"
                        style={{ fontSize: "0.68rem", letterSpacing: "0.3px" }}
                      >
                        {t.tournament_type?.replace(/_/g, " ").toUpperCase() ||
                          "TOURNAMENT"}
                      </span>
                    </div>

                    <h5
                      className="fw-bold text-dark m-0 text-uppercase lh-sm"
                      style={{ fontSize: "0.95rem", color: "#0f172a" }}
                    >
                      {t.name}
                    </h5>
                  </div>

                  {/* Compact Details */}
                  <div className="px-3 pb-2">
                    <div className="d-flex justify-content-between text-muted small mb-2">
                      <div>
                        <div className="text-uppercase fw-semibold" style={{ fontSize: "0.62rem" }}>
                          Start
                        </div>
                        <div className="fw-semibold text-dark" style={{ fontSize: "0.8rem" }}>
                          {t.start_time
                            ? new Date(t.start_time).toLocaleDateString()
                            : "TBD"}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-uppercase fw-semibold" style={{ fontSize: "0.62rem" }}>
                          End
                        </div>
                        <div
                          className={`fw-semibold ${
                            t.end_time && new Date(t.end_time) < new Date()
                              ? "text-danger"
                              : "text-dark"
                          }`}
                          style={{ fontSize: "0.8rem" }}
                        >
                          {t.end_time
                            ? new Date(t.end_time).toLocaleDateString()
                            : "TBD"}
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-2">
                      <span className="text-muted" style={{ fontSize: "0.65rem" }}>
                        Host
                      </span>
                      <div className="fw-semibold text-primary" style={{ fontSize: "0.82rem" }}>
                        {t.host_name}
                      </div>
                    </div>

                    {/* Prize row */}
                    <div className="d-flex justify-content-between text-center border-top pt-2">
                      <div>
                        <div className="text-muted fw-semibold" style={{ fontSize: "0.6rem" }}>
                          1ST
                        </div>
                        <div className="fw-bold text-warning" style={{ fontSize: "0.85rem" }}>
                          {t.first_place_prize
                            ? `KSH ${parseFloat(t.first_place_prize).toLocaleString()}`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted fw-semibold" style={{ fontSize: "0.6rem" }}>
                          2ND
                        </div>
                        <div className="fw-bold text-secondary" style={{ fontSize: "0.85rem" }}>
                          {t.second_place_prize
                            ? `KSH ${parseFloat(t.second_place_prize).toLocaleString()}`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted fw-semibold" style={{ fontSize: "0.6rem" }}>
                          3RD
                        </div>
                        <div className="fw-bold text-danger" style={{ fontSize: "0.85rem" }}>
                          {t.third_place_prize
                            ? `KSH ${parseFloat(t.third_place_prize).toLocaleString()}`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Budget Footer */}
                  <div className="mt-auto px-3 py-2 bg-light border-top text-center">
                    <div
                      className="text-muted fw-bold text-uppercase"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.5px" }}
                    >
                      Total Prize
                    </div>
                    <div className="fw-bold text-primary" style={{ fontSize: "1.1rem" }}>
                      KSH {t.total_budget.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MatchPreviews />
    </>
  );
};

export default TournamentList;