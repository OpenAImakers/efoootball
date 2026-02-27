// src/api/MatchesApi.ts
const MATCHES_API_URL = process.env.REACT_APP_MATCH_API!;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  event_date: string;
  odds_home?: string;
  odds_draw?: string;
  odds_away?: string;
}

export const fetchMatchesByLeague = async (league: number = 1): Promise<Match[]> => {
  try {
    const res = await fetch(MATCHES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ league }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const data = await res.json();
    return data.results || [];
  } catch (err: any) {
    throw new Error(err.message || "Failed to fetch matches");
  }
};