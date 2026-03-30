import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";

const BRAND = {
  NAVY: "#1A2251",
  ORANGE: "#F38D1F",
  CYAN: "#00B4D8",
  WHITE: "#FFFFFF",
  LIGHT_BG: "#F8F9FD"
};

const STAGES = ["ALL", "GROUP", "QUARTER", "SEMI", "FINAL", "THIRD_PLACE"];

export default function MatchesList() {
  const [tournaments, setTournaments] = useState<{ id: any; name: string }[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("all");
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<{ [key: number]: any }>({});
  const [userVotes, setUserVotes] = useState<{ [key: number]: string }>({});
  const [stage, setStage] = useState("ALL"); // Now being used
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTournaments() {
      const { data } = await supabase.from("tournaments").select("id, name").order("created_at", { ascending: false });
      if (data) setTournaments([{ id: "all", name: "All Matches" }, ...data]);
    }
    loadTournaments();
  }, []);

  const fetchStatsAndVotes = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const { data: allVotes } = await supabase.from("match_votes").select("match_id, predicted_winner");
    
    if (allVotes) {
      const summary: { [key: number]: any } = {};
      allVotes.forEach((v) => {
        if (!summary[v.match_id]) summary[v.match_id] = { home: 0, away: 0, draw: 0, total: 0 };
        summary[v.match_id][v.predicted_winner]++;
        summary[v.match_id].total++;
      });
      setStats(summary);
    }

    if (authData.user) {
      const { data: myVotes } = await supabase.from("match_votes").select("match_id, predicted_winner").eq("user_id", authData.user.id);
      if (myVotes) {
        const voteMap: { [key: number]: string } = {};
        myVotes.forEach(v => voteMap[v.match_id] = v.predicted_winner);
        setUserVotes(voteMap);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      let query = supabase.from("matches").select(`
        id, home_team:home_team_id(name), away_team:away_team_id(name),
        stage, played, tournament:tournament_id(name)
      `).eq("played", false);

      if (selectedTournamentId !== "all") query = query.eq("tournament_id", Number(selectedTournamentId));
      if (stage !== "ALL") query = query.eq("stage", stage);

      const { data } = await query.order("id", { ascending: true });
      setMatches(data || []);
      fetchStatsAndVotes();
      setLoading(false);
    }
    fetchMatches();
  }, [selectedTournamentId, stage, fetchStatsAndVotes]);

  const handleVote = async (matchId: number, choice: "home" | "draw" | "away") => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return alert("Please log in to vote!");
    if (userVotes[matchId]) return;

    const { error } = await supabase.from("match_votes").insert({
      match_id: matchId, user_id: authData.user.id, predicted_winner: choice,
    });

    if (!error) {
      setUserVotes(prev => ({ ...prev, [matchId]: choice }));
      fetchStatsAndVotes();
    }
  };

  const getPercent = (matchId: number, type: string) => {
    const s = stats[matchId];
    return (!s || s.total === 0) ? 0 : Math.round((s[type] / s.total) * 100);
  };

  return (
    <div className="container-fluid py-3" style={{ backgroundColor: BRAND.LIGHT_BG, minHeight: "100vh" }}>
      
      {/* 1. TOURNAMENT SCROLLER */}
      <div className="d-flex overflow-auto pb-2 no-scrollbar mb-3" style={{ gap: '10px' }}>
        {tournaments.map((t) => (
          <button key={t.id} onClick={() => setSelectedTournamentId(t.id.toString())}
            className="btn rounded-pill px-4 fw-bold shadow-sm flex-shrink-0"
            style={{ 
              backgroundColor: selectedTournamentId === t.id.toString() ? BRAND.NAVY : BRAND.WHITE,
              color: selectedTournamentId === t.id.toString() ? BRAND.WHITE : BRAND.NAVY,
              border: `1px solid ${BRAND.NAVY}`
            }}>
            {t.name}
          </button>
        ))}
      </div>

      {/* 2. STAGE FILTERS (Fixes the "unused" warning) */}
      <div className="d-flex overflow-auto pb-3 no-scrollbar mb-4" style={{ gap: '8px' }}>
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className="btn btn-sm rounded-pill px-3 flex-shrink-0 fw-bold"
            style={{ 
              backgroundColor: stage === s ? BRAND.ORANGE : BRAND.WHITE,
              color: stage === s ? BRAND.WHITE : BRAND.ORANGE,
              border: `1px solid ${BRAND.ORANGE}`,
              fontSize: '0.75rem'
            }}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{color: BRAND.ORANGE}} /></div>
        ) : matches.length === 0 ? (
          <div className="text-center py-5 text-muted">No matches found for this selection.</div>
        ) : matches.map((m) => (
          <div key={m.id} className="col-12 col-md-6 col-xl-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="p-2 px-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: BRAND.NAVY, color: BRAND.WHITE }}>
                <span className="small fw-bold">{m.tournament?.name}</span>
                <button 
                  onClick={() => navigate(`/match/${m.id}/vote`)} 
                  className="btn btn-sm fw-bold p-0 text-decoration-none" style={{ color: BRAND.ORANGE }}>
                  STATS →
                </button>
              </div>

              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-4 text-center">
                  <div style={{ width: '40%' }}>
                    <img src="/teamlogo.png" alt="h" className="rounded-circle mb-2 border-2 border" style={{ width: '55px', borderColor: BRAND.CYAN }} />
                    <div className="fw-bold text-dark text-truncate">{m.home_team?.name}</div>
                  </div>
                  <div className="fw-black opacity-25" style={{ fontSize: '1.2rem', color: BRAND.NAVY }}>VS</div>
                  <div style={{ width: '40%' }}>
                    <img src="/teamlogo.png" alt="a" className="rounded-circle mb-2 border-2 border" style={{ width: '55px', borderColor: BRAND.ORANGE }} />
                    <div className="fw-bold text-dark text-truncate">{m.away_team?.name}</div>
                  </div>
                </div>

                <div className="d-flex gap-2 mb-4">
                  {[
                    { label: '1', val: 'home', color: BRAND.CYAN },
                    { label: 'X', val: 'draw', color: BRAND.NAVY },
                    { label: '2', val: 'away', color: BRAND.ORANGE }
                  ].map((btn) => (
                    <button 
                      key={btn.val}
                      onClick={() => handleVote(m.id, btn.val as any)}
                      className="btn flex-fill py-2 fw-bold shadow-sm"
                      style={{ 
                        backgroundColor: userVotes[m.id] === btn.val ? btn.color : BRAND.WHITE,
                        color: userVotes[m.id] === btn.val ? BRAND.WHITE : btn.color,
                        border: `2px solid ${btn.color}`
                      }}
                      disabled={!!userVotes[m.id]}>
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="p-3" style={{ background: '#f1f3f9', borderRadius: '12px' }}>
                  <div className="d-flex justify-content-between small mb-2 fw-bold">
                    <span style={{ color: BRAND.CYAN }}>{getPercent(m.id, 'home')}%</span>
                    <span style={{ color: BRAND.NAVY }}>{getPercent(m.id, 'draw')}%</span>
                    <span style={{ color: BRAND.ORANGE }}>{getPercent(m.id, 'away')}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', borderRadius: '20px' }}>
                    <div className="progress-bar" style={{ width: `${getPercent(m.id, 'home')}%`, backgroundColor: BRAND.CYAN }}></div>
                    <div className="progress-bar" style={{ width: `${getPercent(m.id, 'draw')}%`, backgroundColor: BRAND.NAVY }}></div>
                    <div className="progress-bar" style={{ width: `${getPercent(m.id, 'away')}%`, backgroundColor: BRAND.ORANGE }}></div>
                  </div>
                  <div className="text-center mt-2 small fw-bold text-muted" style={{ fontSize: '0.7rem' }}>
                    {stats[m.id]?.total || 0} VOTES
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .fw-black { font-weight: 900; }
      `}</style>
    </div>
  );
}