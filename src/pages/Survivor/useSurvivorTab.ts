import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { POPUP_COLORS } from '../Jackpot/useFootballTab';

export type SurvivorSelection = 'HOME' | 'AWAY';
export type PopupVariant = 'info' | 'success' | 'error' | 'warning';

export interface SurvivorPool {
  id: string;
  name: string;
  entry_fee: number;
  rake_pct: number;
  max_entries_per_user: number;
  status: string;
  closes_at: string | null;
  created_at: string;
}

export interface SurvivorRound {
  id: string;
  pool_id: string;
  round_number: number;
  closes_at: string;
  status: string;
}

export interface SurvivorMatch {
  id: string;
  round_id: string;
  event_id: number | null;
  home_team: string;
  away_team: string;
  match_time: string | null;
  home_score: number | null;
  away_score: number | null;
  outcome: 'HOME' | 'DRAW' | 'AWAY' | null;
  status: string;
}

export interface SurvivorPlayer {
  id: string;
  pool_id: string;
  user_id: string;
  entry_number: number;
  entry_fee: number;
  alive: boolean;
  eliminated_round: number | null;
  created_at: string;
}

export interface SurvivorPick {
  id: string;
  pool_id: string;
  round_id: string;
  player_id: string;
  user_id: string;
  match_id: string;
  selection: SurvivorSelection;
  team_name: string;
  result: 'WON' | 'LOST' | 'PUSH' | null;
  created_at: string;
}

export interface PopupState {
  visible: boolean;
  title: string;
  message: string;
  variant: PopupVariant;
  actions?: { label: string; onClick: () => void; secondary?: boolean }[];
}

export { POPUP_COLORS };

export const SURVIVOR_ACCENT = '#38bdf8';
export const SURVIVOR_ALIVE = '#4ade80';
export const SURVIVOR_OUT = '#f87171';

export const formatKes = (value: number | null | undefined): string =>
  `KSh ${Number(value ?? 0).toLocaleString()}`;

export const formatKickoff = (ts?: string | null): string => {
  if (!ts) return 'TBD';
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function useSurvivorTab() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pools, setPools] = useState<SurvivorPool[]>([]);

  // Detail state
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<SurvivorRound[]>([]);
  const [players, setPlayers] = useState<SurvivorPlayer[]>([]);
  const [picks, setPicks] = useState<SurvivorPick[]>([]);
  const [matchesByRound, setMatchesByRound] = useState<Record<string, SurvivorMatch[]>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // Action state
  const [joining, setJoining] = useState(false);
  const [submittingMatch, setSubmittingMatch] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const showPopup = useCallback((config: Omit<PopupState, 'visible'>) => {
    setPopup({ ...config, visible: true });
  }, []);

  const dismissPopup = useCallback(
    () => setPopup((p) => ({ ...p, visible: false })),
    []
  );

  const fetchPools = useCallback(async () => {
    const { data, error } = await supabase
      .from('survivor_pools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching survivor pools:', error.message);
      return [] as SurvivorPool[];
    }
    setPools((data || []) as SurvivorPool[]);
    return (data || []) as SurvivorPool[];
  }, []);

  const fetchPoolDetail = useCallback(async (poolId: string) => {
    const roundsRes = await supabase
      .from('survivor_rounds')
      .select('*')
      .eq('pool_id', poolId)
      .order('round_number', { ascending: true });

    const fetchedRounds = (roundsRes.data || []) as SurvivorRound[];
    setRounds(fetchedRounds);

    const playersRes = await supabase
      .from('survivor_players')
      .select('*')
      .eq('pool_id', poolId)
      .order('entry_number', { ascending: true });

    const fetchedPlayers = (playersRes.data || []) as SurvivorPlayer[];
    setPlayers(fetchedPlayers);

    const picksRes = await supabase
      .from('survivor_picks')
      .select('*')
      .eq('pool_id', poolId)
      .order('created_at', { ascending: true });

    const fetchedPicks = (picksRes.data || []) as SurvivorPick[];
    setPicks(fetchedPicks);

    if (fetchedRounds.length > 0) {
      const roundIds = fetchedRounds.map((r) => r.id);
      const matchesRes = await supabase
        .from('survivor_round_matches')
        .select('*')
        .in('round_id', roundIds)
        .order('match_time', { ascending: true, nullsFirst: false });

      const grouped: Record<string, SurvivorMatch[]> = {};
      ((matchesRes.data || []) as SurvivorMatch[]).forEach((m) => {
        if (!grouped[m.round_id]) grouped[m.round_id] = [];
        grouped[m.round_id].push(m);
      });
      setMatchesByRound(grouped);
    } else {
      setMatchesByRound({});
    }

    // Resolve usernames for the standings list (two-query: no FK to profiles guaranteed)
    const uniqueUserIds = Array.from(new Set(fetchedPlayers.map((p) => p.user_id)));
    if (uniqueUserIds.length > 0) {
      const profilesRes = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', uniqueUserIds);

      const map: Record<string, string> = {};
      ((profilesRes.data || []) as { id: string; username: string | null }[]).forEach((p) => {
        map[p.id] = p.username || 'player';
      });
      setUsernames(map);
    } else {
      setUsernames({});
    }
  }, []);

  const openPool = useCallback(
    async (poolId: string | null) => {
      setSelectedPoolId(poolId);
      setRounds([]);
      setPlayers([]);
      setPicks([]);
      setMatchesByRound({});
      setActiveEntryId(null);
      if (!poolId) return;
      await fetchPoolDetail(poolId);
    },
    [fetchPoolDetail]
  );

  const refresh = useCallback(async () => {
    if (selectedPoolId) {
      await fetchPoolDetail(selectedPoolId);
    }
    await fetchPools();
  }, [selectedPoolId, fetchPoolDetail, fetchPools]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) setUserId(user?.id ?? null);
      await fetchPools();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchPools]);

  // ---- Derived values -------------------------------------------------------

  const selectedPool = useMemo(
    () => pools.find((p) => p.id === selectedPoolId) ?? null,
    [pools, selectedPoolId]
  );

  const myEntries = useMemo(
    () =>
      players
        .filter((p) => userId && p.user_id === userId)
        .sort((a, b) => a.entry_number - b.entry_number),
    [players, userId]
  );

  const activeEntry = useMemo(
    () => myEntries.find((e) => e.id === activeEntryId) ?? myEntries[0] ?? null,
    [myEntries, activeEntryId]
  );

  // Prefer the first open round; otherwise the latest round
  const currentRound = useMemo(() => {
    if (rounds.length === 0) return null;
    const open = rounds.find((r) => r.status === 'open');
    return open ?? rounds[rounds.length - 1];
  }, [rounds]);

  const currentMatches = useMemo(
    () => (currentRound ? matchesByRound[currentRound.id] ?? [] : []),
    [currentRound, matchesByRound]
  );

  const currentPicksByEntry = useMemo(() => {
    const map: Record<string, SurvivorPick> = {};
    if (currentRound) {
      picks
        .filter((p) => p.round_id === currentRound.id)
        .forEach((p) => {
          map[p.player_id] = p;
        });
    }
    return map;
  }, [picks, currentRound]);

  // Teams already used by each entry in PAST rounds (no-repeat rule)
  const usedTeamsByEntry = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    if (currentRound) {
      picks
        .filter((p) => {
          const round = rounds.find((r) => r.id === p.round_id);
          return round && round.round_number < currentRound.round_number;
        })
        .forEach((p) => {
          if (!map[p.player_id]) map[p.player_id] = new Set();
          map[p.player_id].add(p.team_name);
        });
    }
    return map;
  }, [picks, rounds, currentRound]);

  const potTotal = useMemo(
    () => players.reduce((sum, p) => sum + Number(p.entry_fee || 0), 0),
    [players]
  );

  const prizePot = useMemo(() => {
    const rake = Number(selectedPool?.rake_pct ?? 0);
    return potTotal * (1 - rake / 100);
  }, [potTotal, selectedPool]);

  const alivePlayers = useMemo(() => players.filter((p) => p.alive), [players]);
  const aliveCount = alivePlayers.length;

  // Round history for the entries I own
  const roundHistory = useMemo(() => {
    return rounds
      .slice()
      .sort((a, b) => b.round_number - a.round_number)
      .map((round) => {
        const roundMatches = matchesByRound[round.id] ?? [];
        return {
          round,
          matches: roundMatches,
          myResults: myEntries.map((entry) => {
            const pick = picks.find(
              (p) => p.round_id === round.id && p.player_id === entry.id
            );
            const match = pick
              ? roundMatches.find((m) => m.id === pick.match_id)
              : null;
            return {
              entry,
              pick: pick ?? null,
              match: match ?? null,
            };
          }),
        };
      });
  }, [rounds, matchesByRound, picks, myEntries]);

  // ---- Actions --------------------------------------------------------------

  const handleJoin = useCallback(
    async (pool: SurvivorPool) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setJoining(true);
      try {
        const { data: result, error } = await supabase.rpc('join_survivor_pool', {
          p_pool_id: pool.id,
        });

        if (error) throw error;

        if (result === 'SUCCESS') {
          showPopup({
            title: "You're In! 🔥",
            message: `Entry confirmed for ${pool.name}. You're standing with the pack — make your Round 1 pick before the deadline.`,
            variant: 'success',
          });
          await fetchPools();
          await fetchPoolDetail(pool.id);
          return;
        }

        if (result === 'INSUFFICIENT_BALANCE') {
          showPopup({
            title: 'Insufficient Balance',
            message: `You need ${formatKes(pool.entry_fee)} to enter ${pool.name}. Top up your wallet to continue.`,
            variant: 'warning',
            actions: [
              { label: 'Cancel', onClick: dismissPopup, secondary: true },
              {
                label: 'Deposit',
                onClick: () => {
                  dismissPopup();
                  navigate('/deposit');
                },
              },
            ],
          });
          return;
        }

        if (result === 'MAX_ENTRIES_REACHED') {
          showPopup({
            title: 'Entry Limit Reached',
            message: `You've used all ${pool.max_entries_per_user} allowed ent${pool.max_entries_per_user > 1 ? 'ries' : 'ry'} for this pool.`,
            variant: 'warning',
          });
          return;
        }

        if (result === 'POOL_NOT_OPEN' || result === 'POOL_CLOSED') {
          showPopup({
            title: 'Entries Closed',
            message: 'This pool is no longer accepting new players. Catch the next one!',
            variant: 'warning',
          });
          return;
        }

        if (result === 'WALLET_NOT_FOUND') {
          showPopup({
            title: 'Wallet Not Found',
            message:
              'We could not find your wallet. Please sign out and sign in again, or contact support.',
            variant: 'error',
          });
          return;
        }

        if (result === 'NOT_AUTHENTICATED') {
          navigate('/auth');
          return;
        }

        showPopup({
          title: 'Could Not Process',
          message: 'Something went wrong charging your entry fee. Please try again.',
          variant: 'error',
        });
      } catch (err: any) {
        console.error('Join failed:', err);
        showPopup({
          title: 'Join Failed',
          message: err?.message || 'Unable to join this pool. Please try again.',
          variant: 'error',
        });
      } finally {
        setJoining(false);
      }
    },
    [navigate, showPopup, dismissPopup, fetchPools, fetchPoolDetail]
  );

  const handlePick = useCallback(
    async (match: SurvivorMatch, selection: SurvivorSelection) => {
      if (!selectedPoolId || !currentRound) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      if (!activeEntry) {
        showPopup({
          title: 'Not Entered',
          message: 'Join this pool first before making picks.',
          variant: 'warning',
          actions: [
            { label: 'OK', onClick: dismissPopup, secondary: true },
          ],
        });
        return;
      }

      if (!activeEntry.alive) {
        showPopup({
          title: 'Eliminated',
          message: 'This entry is out of the pool. Better luck in the next one!',
          variant: 'warning',
        });
        return;
      }

      setSubmittingMatch(match.id);
      try {
        const { data: result, error } = await supabase.rpc('submit_survivor_pick', {
          p_pool_id: selectedPoolId,
          p_round_id: currentRound.id,
          p_player_id: activeEntry.id,
          p_match_id: match.id,
          p_selection: selection,
        });

        if (error) throw error;

        if (result === 'SUCCESS') {
          await fetchPoolDetail(selectedPoolId);
          return;
        }

        const messages: Record<string, { title: string; message: string; variant: PopupVariant }> = {
          TEAM_ALREADY_USED: {
            title: 'Team Already Used',
            message: `You've already picked ${selection === 'HOME' ? match.home_team : match.away_team} in an earlier round. Pick a fresh team — no repeats!`,
            variant: 'warning',
          },
          ROUND_CLOSED: {
            title: 'Picks Locked',
            message: 'The deadline for this round has passed.',
            variant: 'warning',
          },
          PLAYER_ELIMINATED: {
            title: 'Eliminated',
            message: 'This entry is out of the pool.',
            variant: 'warning',
          },
          MATCH_LOCKED: {
            title: 'Match Locked',
            message: 'This match is no longer available for picks.',
            variant: 'warning',
          },
          ENTRY_NOT_FOUND: {
            title: 'Entry Not Found',
            message: 'Join the pool first before making picks.',
            variant: 'warning',
          },
        };

        const preset = messages[result];
        if (preset) {
          showPopup(preset);
          return;
        }

        showPopup({
          title: 'Pick Failed',
          message: 'Something went wrong saving your pick. Please try again.',
          variant: 'error',
        });
      } catch (err: any) {
        console.error('Pick failed:', err);
        showPopup({
          title: 'Pick Failed',
          message: err?.message || 'Unable to save your pick. Please try again.',
          variant: 'error',
        });
      } finally {
        setSubmittingMatch(null);
      }
    },
    [
      selectedPoolId,
      currentRound,
      activeEntry,
      navigate,
      showPopup,
      dismissPopup,
      fetchPoolDetail,
    ]
  );

  return {
    // state
    loading,
    userId,
    pools,
    selectedPoolId,
    rounds,
    players,
    picks,
    matchesByRound,
    usernames,
    activeEntryId,
    joining,
    submittingMatch,
    popup,
    // derived
    selectedPool,
    myEntries,
    activeEntry,
    currentRound,
    currentMatches,
    currentPicksByEntry,
    usedTeamsByEntry,
    potTotal,
    prizePot,
    alivePlayers,
    aliveCount,
    roundHistory,
    // actions
    setActiveEntryId,
    openPool,
    refresh,
    showPopup,
    dismissPopup,
    handleJoin,
    handlePick,
  };
}
