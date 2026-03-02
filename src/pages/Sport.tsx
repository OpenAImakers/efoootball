import { useEffect, useState, useMemo } from "react";
import { fetchGlobalMatches, Match } from "../MatchesApi";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function MatchesList() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [teamMap, setTeamMap] = useState<Record<string, string>>({});
  const [selectedLeague, setSelectedLeague] = useState<string | number>("global");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Syncs team names → 'teams' table
   */
  const syncAndGetTeamMap = async (matches: Match[]): Promise<Record<string, string>> => {
    const names = new Set<string>();
    matches.forEach((m) => {
      const home = m.home_team?.trim();
      const away = m.away_team?.trim();
      if (home && home.length > 0) names.add(home);
      if (away && away.length > 0) names.add(away);
    });

    if (names.size === 0) return {};

    const teamsToUpsert = Array.from(names).map((name) => ({ name }));

    try {
      const { data, error: upsertError } = await supabase
        .from("teams")
        .upsert(teamsToUpsert, {
          onConflict: "name",
          ignoreDuplicates: true,
        })
        .select("id, name");

      if (upsertError) throw upsertError;

      const mapping: Record<string, string> = {};
      data?.forEach((team: any) => {
        if (team?.name && team?.id) {
          mapping[team.name] = String(team.id);
        }
      });

      return mapping;
    } catch (err: any) {
      console.error("[Team Sync] error:", err);
      setError(`Team sync failed: ${err.message || "Unknown error"}`);
      return {};
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchGlobalMatches();
        const mapping = await syncAndGetTeamMap(data);
        setTeamMap(mapping);
        setAllMatches(data);

        const leagueMap: Record<string, any> = {};
        data.forEach((m) => {
          if (m.league?.name && !leagueMap[m.league.name]) {
            leagueMap[m.league.name] = {
              id: m.league.id || m.league.name,
              name: m.league.name,
            };
          }
        });
        setLeagues(Object.values(leagueMap));
      } catch (err: any) {
        setError(err.message || "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const displayedMatches = useMemo(() => {
    if (selectedLeague === "global") return allMatches;
    return allMatches.filter((m) => {
      const leagueId = m.league?.id || m.league?.name;
      return leagueId === selectedLeague;
    });
  }, [selectedLeague, allMatches]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container-fluid py-5 mt-4">
        <div className="row g-4">
          {/* Sidebar - League Filter */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: "90px" }}>
              <div className="card-header bg-white fw-bold py-3">Leagues</div>
              <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "70vh" }}>
                <button
                  onClick={() => setSelectedLeague("global")}
                  className={`list-group-item list-group-item-action border-0 ${
                    selectedLeague === "global" ? "bg-primary text-white" : ""
                  }`}
                >
                  All Events
                </button>

                {leagues.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLeague(l.id)}
                    className={`list-group-item list-group-item-action border-0 ${
                      selectedLeague === l.id ? "bg-primary-subtle text-primary fw-bold" : ""
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content - Matches */}
          <div className="col-lg-9">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h6 className="mb-0 fw-bold">Global Matches & Team Sync</h6>
                <span className="badge bg-success">Connected to 'teams' table</span>
              </div>

              <div className="card-body p-0">
                {error && <div className="alert alert-danger m-3">{error}</div>}

                {displayedMatches.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    No matches available
                  </div>
                ) : (
                  displayedMatches.map((match, i) => {
                    const homeTrimmed = match.home_team?.trim() || "";
                    const awayTrimmed = match.away_team?.trim() || "";
                    const homeId = teamMap[homeTrimmed];
                    const awayId = teamMap[awayTrimmed];

                    return (
                      <div
                        key={i}
                        className="p-3 border-bottom d-flex align-items-center justify-content-between match-item"
                      >
                        <div className="flex-grow-1">
                          <div className="fw-bold text-dark">
                            {match.home_team || "?"} vs {match.away_team || "?"}
                          </div>
                          <div className="text-muted d-flex gap-2 align-items-center" style={{ fontSize: "0.75rem" }}>
                            <span className="text-primary fw-bold">DB IDs:</span>
                            <span className="font-monospace">{homeId || "..."}</span>
                            <span>|</span>
                            <span className="font-monospace">{awayId || "..."}</span>
                            {!homeId && homeTrimmed && (
                              <span className="text-danger small ms-2">(not found: "{homeTrimmed}")</span>
                            )}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          {[match.odds_home, match.odds_draw, match.odds_away].map((val, idx) => (
                            <div
                              key={idx}
                              className="odd-box border rounded bg-light d-flex align-items-center justify-content-center fw-bold small"
                            >
                              {val ?? "-"}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED CSS BLOCK FOR REACT/TYPESCRIPT */}
      <style dangerouslySetInnerHTML={{ __html: `
        .match-item:hover {
          background-color: #f8f9fa;
        }
        .odd-box {
          width: 55px;
          height: 40px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .odd-box:hover {
          background-color: #0d6efd !important;
          color: white;
          border-color: #0d6efd;
        }
      `}} />
    </div>
  );
}