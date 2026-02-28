const MATCHES_API_URL = process.env.REACT_APP_MATCH_API!;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  event_date: string;
  league?: {
    id?: number | string; // Real ID from API
    name: string;
    country: string;
  };
  odds_home?: string;
  odds_draw?: string;
  odds_away?: string;
}

type ApiResponse = Match[] | { results?: Match[] };

const request = async (body: any = {}): Promise<Match[]> => {
  try {
    const res = await fetch(MATCHES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const data: ApiResponse = await res.json();
    return Array.isArray(data) ? data : data?.results || [];
  } catch (err: any) {
    throw new Error(err.message || "Failed to fetch matches");
  }
};

export const fetchGlobalMatches = () => request({});
export const fetchMatchesByLeague = (league: number | string) => request({ league });
export const fetchMatchesByLeagues = (leagues: (number | string)[]) => request({ leagues });

export const fetchJackpotMatches = () => {
  const JACKPOT_LEAGUES = [39, 140, 135, 78, 61];
  return request({ leagues: JACKPOT_LEAGUES });
};