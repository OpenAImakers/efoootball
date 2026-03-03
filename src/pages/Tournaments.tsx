"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

const TournamentList = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Fixed: added 'loading' variable
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  // Memoized fetch function to satisfy ESLint dependency rules
  const fetchTournaments = useCallback(async (currentUser: any) => {
    setLoading(true);
    try {
      const { data: tData, error: tError } = await supabase
        .from("tournaments")
        .select("*, tournament_followers(user_id)")
        .order("created_at", { ascending: false });

      if (tError) throw tError;

      const hostIds = Array.from(new Set(tData.map((t) => t.created_by).filter(Boolean)));
      let idToDisplay: Record<string, string> = {};

      if (hostIds.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", hostIds);
        idToDisplay = Object.fromEntries(pData?.map((p) => [p.id, p.display_name]) || []);
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
  }, []); // Empty array because it only depends on supabase client

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      fetchTournaments(data.user);
    };
    init();
  }, [fetchTournaments]); // fetchTournaments is now a stable dependency

  const handleFollow = async (tournamentId: number, isFollowing: boolean) => {
    if (!user) return alert("Please log in!");

    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? { ...t, isFollowing: !isFollowing, follower_count: t.follower_count + (isFollowing ? -1 : 1) }
          : t
      )
    );

    if (isFollowing) {
      await supabase.from("tournament_followers").delete().match({ tournament_id: tournamentId, user_id: user.id });
    } else {
      await supabase.from("tournament_followers").insert([{ tournament_id: tournamentId, user_id: user.id }]);
    }
  };

  const filtered = tournaments.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-vh-100 py-4" style={{ backgroundColor: "#020617", color: "#f8fafc" }}>
      <div className="container">
        
        {/* Header & Minimal Top-Left Search */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5">
          <div className="mb-3 mb-md-0" style={{ minWidth: "250px" }}>
            <div className="input-group input-group-sm border-bottom border-secondary border-opacity-50">
              <span className="input-group-text bg-transparent border-0 text-secondary ps-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-0 text-white shadow-none ps-2"
                placeholder="Search Arenas..."
                style={{ fontSize: "0.9rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <h1 className="display-6 fw-black m-0 text-center" style={{ 
            background: "linear-gradient(to right, #60a5fa, #a78bfa)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            letterSpacing: "4px",
            fontWeight: 900 
          }}>
            ARENAS
          </h1>

          <div className="d-none d-md-block" style={{ minWidth: "250px" }}></div>
        </div>

        {/* Loading State UI */}
        {loading && tournaments.length === 0 ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((t) => (
              <div key={t.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border-secondary border-opacity-25 shadow-lg position-relative overflow-hidden arena-card" style={{ backgroundColor: "#0f172a", borderRadius: "16px" }}>
                  
                  <div 
                    className="position-relative" 
                    style={{ 
                      height: "180px", 
                      backgroundImage: `url(${t.tournament_avatar || 'https://via.placeholder.com/400x250?text=Arena'})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    <div className="position-absolute w-100 h-100" style={{ background: "linear-gradient(to bottom, rgba(15,23,42,0.1), #0f172a)" }} />
                    
                    <div className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center">
                      <span className={`badge rounded-1 ${t.is_active ? 'bg-success' : 'bg-secondary'} opacity-90 fw-bold`} style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                        <i className="bi bi-broadcast me-1"></i> {t.is_active ? "LIVE" : "DORMANT"}
                      </span>
                      <button 
                        onClick={() => handleFollow(t.id, t.isFollowing)}
                        className={`btn btn-sm px-3 rounded-1 fw-bold transition-all ${t.isFollowing ? 'btn-outline-info' : 'btn-primary shadow-sm'}`}
                        style={{ fontSize: '0.7rem', border: t.isFollowing ? '1px solid #0dcaf0' : 'none' }}
                      >
                        {t.isFollowing ? (
                          <><i className="bi bi-check-lg me-1"></i> Following</>
                        ) : (
                          <><i className="bi bi-plus-lg me-1"></i> Follow</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="card-body px-4 pt-0">
                    <div className="d-flex flex-wrap gap-2 mb-3 mt-n3 position-relative" style={{ zIndex: 5 }}>
                      {t.first_place_prize && (
                        <div className="badge bg-dark border border-warning text-warning d-flex align-items-center gap-1 shadow-sm">
                          <i className="bi bi-trophy-fill"></i> {t.first_place_prize}
                        </div>
                      )}
                      {t.second_place_prize && (
                        <div className="badge bg-dark border border-light text-light d-flex align-items-center gap-1 shadow-sm">
                          <i className="bi bi-award-fill"></i> {t.second_place_prize}
                        </div>
                      )}
                      {t.third_place_prize && (
                        <div className="badge bg-dark border d-flex align-items-center gap-1 shadow-sm" style={{ borderColor: '#cd7f32', color: '#cd7f32' }}>
                          <i className="bi bi-award-fill"></i> {t.third_place_prize}
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-info fw-bold font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                        <i className="bi bi-controller me-1"></i> {t.tournament_type?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-white small fw-bold">
                        <i className="bi bi-people-fill me-1 text-secondary"></i>
                        {t.follower_count}
                      </span>
                    </div>

                    <h3 className="h5 fw-bold text-white mb-3 text-uppercase tracking-tight">{t.name}</h3>

                    <div className="bg-black bg-opacity-40 rounded p-2 mb-3 border border-secondary border-opacity-10">
                      <div className="d-flex align-items-center mb-1">
                        <i className="bi bi-calendar2-check text-info me-2 small"></i>
                        <span className="text-secondary fw-bold small me-2" style={{ fontSize: '0.6rem' }}>START</span>
                        <span className="text-white small fw-bold">{t.start_time ? new Date(t.start_time).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-hourglass-split text-danger me-2 small"></i>
                        <span className="text-secondary fw-bold small me-2" style={{ fontSize: '0.6rem' }}>EXPIRES</span>
                        <span className="text-white small fw-bold">{t.end_time ? new Date(t.end_time).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer bg-transparent border-top border-secondary border-opacity-25 px-4 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="d-block text-secondary fw-bold" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>ORGANIZER</span>
                        <span className="fw-bold" style={{ color: "#818cf8", fontSize: '0.9rem' }}>{t.host_name}</span>
                      </div>
                      <i className="bi bi-chevron-right text-secondary"></i>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .transition-all { transition: all 0.2s ease-in-out; }
        .tracking-tight { letter-spacing: -0.5px; }
        .arena-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .arena-card:hover { transform: translateY(-4px); border-color: rgba(96, 165, 250, 0.5) !important; }
      `}</style>
    </div>
  );
};

export default TournamentList;