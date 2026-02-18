import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { supabase } from "../supabase";

interface MatchStat {
  matchName: string;
  stage: string;
  home: number;
  away: number;
  draw: number;
  total: number;
}

interface PredictionsSummaryProps {
  tournamentId: number;
}

export default function PredictionsSummary({ tournamentId }: PredictionsSummaryProps) {
  const [stats, setStats] = useState<MatchStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Wrapped in useCallback to stabilize the function reference
  const fetchSummary = useCallback(async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("match_votes")
      .select(`
        predicted_winner,
        matches!inner (
          tournament_id,
          stage,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        )
      `)
      .eq("matches.tournament_id", tournamentId);

    if (error || !data) {
      setStats([]);
      setLoading(false);
      return;
    }

    const summaryMap: { [key: string]: MatchStat } = {};

    data.forEach((v: any) => {
      const match = v.matches;
      if (!match) return; 
      
      const matchName = `${match.home_team.name} vs ${match.away_team.name}`;
      
      if (!summaryMap[matchName]) {
        summaryMap[matchName] = { 
          matchName, 
          stage: match.stage, 
          home: 0, away: 0, draw: 0, total: 0 
        };
      }

      const pick = v.predicted_winner as "home" | "away" | "draw";
      // Using 'in' check to avoid ESLint property issues
      if (pick in summaryMap[matchName]) {
        summaryMap[matchName][pick]++;
        summaryMap[matchName].total++;
      }
    });

    setStats(Object.values(summaryMap));
    setLoading(false);
  }, [tournamentId]); // fetchSummary updates if tournamentId changes

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]); // Now fetchSummary is a valid dependency

  const getPercent = (count: number, total: number) => 
    total === 0 ? 0 : Math.round((count / total) * 100);

  if (loading) return <div className="p-3 text-center small text-muted">Loading stats...</div>;

  return (
    <div className="mb-4">
      <h6 className="text-uppercase fw-bold text-muted mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
        Community Predictions
      </h6>
      
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ minWidth: '400px' }}>
            <thead className="table-dark">
              <tr style={{ fontSize: '0.75rem' }}>
                <th className="ps-3 py-3">MATCH</th>
                <th className="text-center">HOME</th>
                <th className="text-center">DRAW</th>
                <th className="text-center">AWAY</th>
                <th className="text-center bg-darker">VOTES</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No votes yet for this tournament.</td></tr>
              ) : (
                stats.map((s, idx) => (
                  <tr key={idx} className="border-bottom">
                    <td className="ps-3 py-3">
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{s.matchName}</div>
                      <div className="text-muted small" style={{ fontSize: '0.7rem' }}>{s.stage}</div>
                    </td>
                    <td className="text-center fw-bold text-primary">{getPercent(s.home, s.total)}%</td>
                    <td className="text-center fw-bold text-secondary">{getPercent(s.draw, s.total)}%</td>
                    <td className="text-center fw-bold text-danger">{getPercent(s.away, s.total)}%</td>
                    <td className="text-center fw-bold bg-light" style={{ fontSize: '0.85rem' }}>{s.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}