import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

export type PredictionChoice = '1' | 'X' | '2';
export type TierKey = 5 | 6 | 7;
export type PopupVariant = 'info' | 'success' | 'error' | 'warning';

export interface JackpotGame {
  id: string;
  game_number: number;
  home_team: string;
  away_team: string;
  match_time?: string | null;
  status: string;
  home_odds?: number | null;
  away_odds?: number | null;
  draw_odds?: number | null;
}

export interface Jackpot {
  id: string;
  name: string;
  game_count: number;
  entry_fee: number;
  prize_amount: number | null;
  status: string;
  jackpot_games: JackpotGame[];
}

export interface TierConfig {
  key: TierKey;
  title: string;
  entryFee: number;
  prize: number;
  color: string;
  badgeBg: string;
}

export interface PopupState {
  visible: boolean;
  title: string;
  message: string;
  variant: PopupVariant;
  actions?: { label: string; onClick: () => void; secondary?: boolean }[];
}

export const TIER_CONFIGS: TierConfig[] = [
  { key: 5, title: 'Contest 5', entryFee: 25, prize: 2500, color: '#0EA5E9', badgeBg: 'rgba(14, 165, 233, 0.15)' },
  { key: 6, title: 'Contest 6', entryFee: 30, prize: 5000, color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
  { key: 7, title: 'Contest 7', entryFee: 50, prize: 10000, color: '#EC4899', badgeBg: 'rgba(236, 72, 153, 0.15)' },
];

export const SELECTION_MAP: Record<PredictionChoice, 'HOME' | 'DRAW' | 'AWAY'> = {
  '1': 'HOME',
  'X': 'DRAW',
  '2': 'AWAY',
};

export const DOWNLOAD_URL =
  'https://github.com/Newton-oyweri/rankings-app/releases/download/v0.1/Rankings.apk';

export const POPUP_COLORS: Record<PopupVariant, { bg: string; fg: string; icon: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', fg: '#4ade80', icon: 'bi-check-circle-fill' },
  error: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171', icon: 'bi-exclamation-circle-fill' },
  warning: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', icon: 'bi-exclamation-triangle-fill' },
  info: { bg: 'rgba(56,189,248,0.15)', fg: '#38bdf8', icon: 'bi-info-circle-fill' },
};

export function formatMatchTime(matchTime?: string | null): string {
  if (!matchTime) return 'TBD';
  return new Date(matchTime).toLocaleDateString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOdds(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(2);
}

export function useFootballTab() {
  const navigate = useNavigate();

  const [selectedTier, setSelectedTier] = useState<TierKey>(7);
  const [jackpotsMap, setJackpotsMap] = useState<Record<number, Jackpot>>({});
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<Record<string, PredictionChoice>>({});
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const showPopup = (config: Omit<PopupState, 'visible'>) =>
    setPopup({ ...config, visible: true });

  const dismissPopup = () => setPopup((p) => ({ ...p, visible: false }));

  const fetchJackpots = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('jackpots')
        .select(
          `
          id,
          name,
          game_count,
          entry_fee,
          prize_amount,
          status,
          jackpot_games (
            id,
            game_number,
            home_team,
            away_team,
            match_time,
            status,
            home_odds,
            away_odds,
            draw_odds
          )
        `
        )
        .eq('status', 'open');

      if (error) {
        console.error('Error fetching jackpots:', error.message);
        return;
      }

      if (data) {
        const mapped: Record<number, Jackpot> = {};
        data.forEach((j: any) => {
          const sortedGames = (j.jackpot_games || []).sort(
            (a: JackpotGame, b: JackpotGame) => a.game_number - b.game_number
          );
          mapped[j.game_count] = { ...j, jackpot_games: sortedGames } as Jackpot;
        });
        setJackpotsMap(mapped);
      }
    } catch (err) {
      console.error('Error in fetchJackpots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJackpots();
  }, [fetchJackpots]);

  // Reset expanded + picks when tier changes
  useEffect(() => {
    setExpandedIds(new Set());
    setPredictions({});
  }, [selectedTier]);

  const activeConfig = TIER_CONFIGS.find((t) => t.key === selectedTier)!;
  const activeJackpot = jackpotsMap[selectedTier];
  const currentMatches = activeJackpot?.jackpot_games || [];

  const selectedCount = currentMatches.filter((m) => predictions[m.id]).length;
  const isComplete = currentMatches.length > 0 && selectedCount === currentMatches.length;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(currentMatches.map((m) => m.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const handlePick = (gameId: string, choice: PredictionChoice) => {
    setPredictions((prev) => {
      const next = { ...prev };
      if (next[gameId] === choice) delete next[gameId];
      else next[gameId] = choice;
      return next;
    });
  };

  const handleSubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!activeJackpot) {
      showPopup({
        title: 'Unavailable',
        message: 'This contest is not currently open. Please try another tier.',
        variant: 'warning',
      });
      return;
    }

    if (!isComplete) {
      showPopup({
        title: 'Incomplete Picks',
        message: `Pick a result for all ${currentMatches.length} fixtures before submitting. You have ${selectedCount} so far.`,
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Duplicate-entry guard
      const { data: existing, error: existingError } = await supabase
        .from('jackpot_entries')
        .select('id, entry_number')
        .eq('jackpot_id', activeJackpot.id)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        showPopup({
          title: 'Already Entered',
          message: `You've already placed an entry in ${activeConfig.title} (Entry #${existing.entry_number}). Each player can enter this contest only once.`,
          variant: 'warning',
        });
        return;
      }

      // Deduct entry fee (atomic, server-side)
      const feeReference = `jkp_${activeJackpot.id.slice(0, 8)}_${user.id.slice(0, 8)}_${Date.now()}`;

      const { data: deductResult, error: deductError } = await supabase.rpc(
        'deduct_jackpot_entry_fee',
        {
          p_user_id: user.id,
          p_jackpot_id: activeJackpot.id,
          p_reference: feeReference,
        }
      );

      if (deductError) throw deductError;

      if (deductResult === 'INSUFFICIENT_BALANCE') {
        showPopup({
          title: 'Insufficient Balance',
          message: `You need KSh ${activeConfig.entryFee} to enter ${activeConfig.title}. Top up your wallet to continue.`,
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

      if (deductResult === 'WALLET_NOT_FOUND') {
        showPopup({
          title: 'Wallet Not Found',
          message:
            'We could not find your wallet. Please sign out and sign in again, or contact support.',
          variant: 'error',
        });
        return;
      }

      if (deductResult === 'JACKPOT_NOT_OPEN') {
        showPopup({
          title: 'Contest Closed',
          message: 'This contest is no longer accepting entries. Please try another tier.',
          variant: 'warning',
        });
        return;
      }

      if (deductResult !== 'SUCCESS') {
        showPopup({
          title: 'Could Not Process',
          message: 'Something went wrong charging your entry fee. Please try again.',
          variant: 'error',
        });
        return;
      }

      // Fee charged — create entry
      const { data: entryData, error: entryError } = await supabase
        .from('jackpot_entries')
        .insert({
          jackpot_id: activeJackpot.id,
          user_id: user.id,
          entry_number: 1,
          entry_fee: activeConfig.entryFee,
          status: 'submitted',
        })
        .select('id')
        .single();

      if (entryError) throw entryError;

      // Insert selections
      const selectionsPayload = currentMatches.map((match) => ({
        entry_id: entryData.id,
        game_id: match.id,
        selection: SELECTION_MAP[predictions[match.id]],
      }));

      const { error: selectionsError } = await supabase
        .from('jackpot_selections')
        .insert(selectionsPayload);

      if (selectionsError) throw selectionsError;

      showPopup({
        title: 'Entry Placed! 🎉',
        message: `Your ${activeConfig.title} predictions have been submitted. Good luck!`,
        variant: 'success',
      });

      setPredictions({});
      setExpandedIds(new Set());
    } catch (error: any) {
      console.error('Submission failed:', error);

      if (
        error?.code === '23505' ||
        /duplicate key|unique constraint/i.test(error?.message ?? '')
      ) {
        showPopup({
          title: 'Already Entered',
          message: `You've already placed an entry in ${activeConfig.title}. Each player can enter this contest only once.`,
          variant: 'warning',
        });
      } else {
        showPopup({
          title: 'Submission Failed',
          message: error?.message || 'Unable to place your entry. Please try again.',
          variant: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // state
    selectedTier,
    setSelectedTier,
    loading,
    expandedIds,
    predictions,
    submitting,
    popup,
    // derived
    activeConfig,
    activeJackpot,
    currentMatches,
    selectedCount,
    isComplete,
    // actions
    showPopup,
    dismissPopup,
    toggleExpand,
    expandAll,
    collapseAll,
    handlePick,
    handleSubmit,
  };
}