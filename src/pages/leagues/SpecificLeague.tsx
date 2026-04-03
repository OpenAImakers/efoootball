import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabase";
import Advert from "../../components/Advert";

export default function SpecificLeague() {
  const { id } = useParams();
  const [league, setLeague] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLeagueData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: leagueData } = await supabase
      .from("leagues")
      .select("*")
      .eq("id", id)
      .single();

    const { data: tournamentsData } = await supabase
      .from("tournaments")
      .select("id, name, start_time, end_time, tournament_type")
      .eq("league_id", id)
      .order("created_at", { ascending: true });

    let allTeams: any[] = [];
    if (tournamentsData?.length) {
      const tournamentIds = tournamentsData.map((t: any) => t.id);
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .in("tournament_id", tournamentIds);
      allTeams = teamsData || [];
    }

    setLeague(leagueData);
    setTeams(allTeams);
    setTournaments(tournamentsData || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchLeagueData();
  }, [fetchLeagueData]);

  // Filter by search term only
  const filteredTeams = useMemo(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      return teams.filter(team => 
        team.name.toLowerCase().includes(term)
      );
    }
    return teams;
  }, [teams, searchTerm]);

  if (loading) {
    return (
      <div className="min-vh-100 bg-konami-dark d-flex align-items-center justify-content-center text-white">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="vh-100 bg-konami-dark text-white font-konami d-flex flex-column overflow-hidden">
      <Advert />

      <div className="container-fluid px-4 flex-grow-1 d-flex flex-column overflow-hidden mt-3">
        {/* Header */}
        <div className="row align-items-center mb-3 flex-shrink-0">
          <div className="col-auto">
            <div className="avatar-frame-sm">
              <img src={league?.avatar_url || "/cup.png"} alt="" className="konami-img" />
            </div>
          </div>
          <div className="col">
            <h3 className="italic fw-black text-uppercase m-0 tracking-tighter">
              {league?.name}
            </h3>
            <div className="d-flex gap-2 smaller text-konami-blue fw-bold text-uppercase">
              <span>{league?.organizer}</span>
              <span className="text-white opacity-25">|</span>
              <span>{league?.season || "S1"}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="row g-3 flex-grow-1 overflow-hidden pb-3">
          
          {/* Left: Info & Rules */}
          <div className="col-lg-3 d-flex flex-column gap-2 overflow-hidden">
            <div className="konami-panel p-3 flex-shrink-0">
              <h6 className="smaller text-konami-blue fw-bold text-uppercase border-bottom border-primary pb-1 mb-2">
                LEAGUE INFO
              </h6>
              <div className="d-flex justify-content-between">
                <span className="smaller opacity-50">TEAMS</span>
                <span className="fw-bold">{teams.length}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="smaller opacity-50">EVENTS</span>
                <span className="fw-bold">{tournaments.length}</span>
              </div>
            </div>

            <div className="konami-panel rules-box flex-grow-1 overflow-auto p-3">
              <h6 className="smaller text-warning fw-bold text-uppercase mb-2 sticky-top bg-dark-panel">
                PROTOCOL / RULES
              </h6>
              <div className="rules-content smaller italic opacity-75">
                {league?.rules || "No rules defined."}
              </div>
            </div>
          </div>

          {/* Right: Tournaments + Teams */}
          <div className="col-lg-9 d-flex flex-column gap-3 overflow-hidden">
            
            {/* Tournaments Table - Scrollable */}
            <div className="d-flex flex-column flex-shrink-0" style={{ height: "auto" }}>
              <div className="list-header d-flex justify-content-between align-items-center mb-2">
                <span className="smaller fw-bold text-uppercase italic tracking-widest text-konami-blue">
                  TOURNAMENTS
                </span>
              </div>
              <div className="table-wrapper overflow-auto" style={{ flex: 1 }}>
                <table className="table table-dark table-hover konami-table m-0">
                  <thead className="sticky-top">
                    <tr>
                      <th>NAME</th>
                      <th className="text-center">TYPE</th>
                      <th>START</th>
                      <th>END</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t.id}>
                        <td className="fw-bold text-uppercase italic smaller">{t.name}</td>
                        <td className="text-center">
                          <span className="badge-type">{t.tournament_type}</span>
                        </td>
                        <td className="smaller opacity-75 text-nowrap">
                          {t.start_time ? new Date(t.start_time).toLocaleDateString() : "TBD"}
                        </td>
                        <td className="smaller opacity-75 text-nowrap">
                          {t.end_time ? new Date(t.end_time).toLocaleDateString() : "TBD"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Teams Section - Scrollable */}
     {/* Teams Section - Scrollable */}
<div className="d-flex flex-column" style={{ height: "calc(100vh - 350px)" }}>
  <div className="list-header d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
    <span className="smaller fw-bold text-uppercase italic tracking-widest text-info">
      PLAYERS
    </span>

    <div className="d-flex align-items-center gap-3">
    <input
  type="text"
  className="form-control form-control-sm bg-dark text-white border-0 search-input"
  placeholder="Search teams..."
  style={{ width: "250px" }}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

    </div>

    <span className="smaller opacity-75 ms-auto">
      Showing {filteredTeams.length} of {teams.length} teams
    </span>
  </div>
  
  <div className="table-wrapper overflow-auto" style={{ flex: 1, minHeight: 0 }}>
    <table className="table table-dark table-hover konami-table m-0">
      <thead className="sticky-top">
        <tr>
          <th style={{ width: "60px" }}>#</th>
          <th>TEAM IDENTITY</th>
          <th>ASSIGNED COMPETITION</th>
        </tr>
      </thead>
      <tbody>
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team, idx) => (
            <tr key={team.id}>
              <td className="text-info fw-bold smaller">{idx + 1}</td>
              <td className="fw-bold text-uppercase italic smaller">{team.name}</td>
              <td className="smaller text-konami-blue italic">
                {tournaments.find(t => t.id === team.tournament_id)?.name || "—"}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="text-center py-5 opacity-50">
              No teams match your filter.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

          </div>
        </div>
      </div>

      <style>{`
      .search-input::placeholder {
  color: #a0aec0 !important;
  opacity: 1 !important;
  font-style: italic;
}
        .bg-konami-dark { background: #030a1a; }
        .bg-dark-panel { background: #05132d; }
        .text-konami-blue { color: #58a6ff; }
        .italic { font-style: italic; }
        .smaller { font-size: 0.7rem; font-weight: 700; }
        
        .avatar-frame-sm { 
          width: 45px; height: 45px; 
          border: 2px solid #0d6efd; 
          transform: skew(-10deg); 
          overflow: hidden; 
        }
        .konami-img { 
          width: 100%; height: 100%; 
          object-fit: cover; 
          transform: skew(10deg) scale(1.1); 
        }
        .konami-panel { 
          background: rgba(13, 110, 253, 0.05); 
          border: 1px solid rgba(13, 110, 253, 0.2); 
        }
        .rules-box { 
          border-left: 3px solid #ffc107; 
          background: rgba(255,193,7, 0.02); 
        }
        .rules-content { white-space: pre-wrap; line-height: 1.4; }

        .table-wrapper { 
          background: rgba(0, 0, 0, 0.3); 
          border: 1px solid rgba(13, 110, 253, 0.2); 
        }
        
        .konami-table thead { 
          background: #051a3d; 
          border-bottom: 2px solid #0d6efd; 
        }
        .konami-table th { 
          font-size: 0.6rem; 
          color: #58a6ff; 
          text-transform: uppercase; 
          padding: 10px 12px; 
        }
        .konami-table td { 
          padding: 9px 12px; 
          border-bottom: 1px solid rgba(255,255,255,0.05); 
        }
        .badge-type { 
          font-size: 0.55rem; 
          padding: 2px 6px; 
          border: 1px solid #58a6ff; 
          color: #58a6ff; 
          text-transform: uppercase; 
          font-weight: 900; 
        }

        /* Hide scrollbar but keep functionality */
        .overflow-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .overflow-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .form-select, .form-control {
          background-color: #05132d !important;
          border: 1px solid rgba(13, 110, 253, 0.4) !important;
          color: white !important;
        }
        .form-select:focus, .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }
        
        /* Sticky headers */
        .sticky-top {
          position: sticky;
          top: 0;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}