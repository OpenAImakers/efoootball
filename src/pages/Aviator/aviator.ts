// src/pages/Aviator/aviator.ts
// Supabase wrapper for the Aviator game.
// No game logic here — just RPC calls, wallet reads, error mapping, and types.
// The game loop lives in AviatorEngine.js; the UI lives in AviatorTab.tsx.

import { supabase } from '../../supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Wallet table config — change these 3 if your schema differs
// ─────────────────────────────────────────────────────────────────────────────

const WALLET_TABLE = 'wallets';
const WALLET_USER_COL = 'user_id';
const WALLET_BALANCE_COL = 'balance';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GameStatus = 'active' | 'won' | 'lost';
export type SettleAction = 'cashout' | 'bust';

export type StartGameResult = {
  session_id: string;
  stake: number;
  game_name: string;
  status: 'active';
  created_at: string;
};

export type SettleGameResult = {
  status: 'won' | 'lost';
  /** Crash point of the round — safe to reveal now that it's settled. */
  multiplier: number;
  /** Multiplier the player actually exited at (NULL on bust). */
  cashout_at: number | null;
  /** Authoritative payout for the row: stake * cashout_at. Already credited to the wallet. */
  payout: number;
};

export type SessionHistoryRow = {
  id: string;
  game_name: string;
  stake: number;
  multiplier: number;
  status: GameStatus;
  payout: number;
  created_at: string;
  settled_at: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

export class AviatorError extends Error {
  readonly code:
    | 'not_authenticated'
    | 'invalid_stake'
    | 'invalid_game_name'
    | 'invalid_action'
    | 'session_not_found'
    | 'already_settled'
    | 'insufficient_funds'
    | 'network'
    | 'unknown';

  constructor(code: AviatorError['code'], message: string) {
    super(message);
    this.name = 'AviatorError';
    this.code = code;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error mapping (plpgsql RAISE EXCEPTION surfaces as error.message)
// ─────────────────────────────────────────────────────────────────────────────

function mapError(rawMessage: string | undefined): AviatorError {
  const msg = (rawMessage ?? '').toLowerCase();

  if (msg.includes('not_authenticated'))
    return new AviatorError('not_authenticated', 'Please sign in to play.');
  if (msg.includes('invalid_stake'))
    return new AviatorError('invalid_stake', 'Invalid stake.');
  if (msg.includes('invalid_game_name'))
    return new AviatorError('invalid_game_name', 'Invalid game.');
  if (msg.includes('invalid_action'))
    return new AviatorError('invalid_action', 'Invalid action.');
  if (msg.includes('session_not_found'))
    return new AviatorError('session_not_found', 'Game session not found.');
  if (msg.includes('already_settled'))
    return new AviatorError('already_settled', 'This game has already been settled.');
  // modify_wallet_balance throws when the balance would go negative
  if (msg.includes('insufficient') || msg.includes('balance'))
    return new AviatorError('insufficient_funds', 'Not enough balance for this stake.');
  if (msg.includes('fetch') || msg.includes('network'))
    return new AviatorError('network', 'Network error. Please try again.');

  return new AviatorError('unknown', 'Something went wrong. Please try again.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet: live balance
// ─────────────────────────────────────────────────────────────────────────────

/** Read the signed-in user's wallet balance. */
export async function fetchWalletBalance(): Promise<number> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new AviatorError('not_authenticated', 'Please sign in to play.');

  const { data, error } = await supabase
    .from(WALLET_TABLE)
    .select('*')
    .eq(WALLET_USER_COL, uid)
    .maybeSingle();

  console.log('[aviator] wallet row:', data, 'error:', error);

  if (error) throw mapError(error.message);
  if (!data) throw new AviatorError('unknown', 'No wallet row found (table/column name or RLS?).');

  const raw = (data as Record<string, unknown>)[WALLET_BALANCE_COL];
  if (raw === undefined) {
    throw new AviatorError('unknown', `Column "${WALLET_BALANCE_COL}" not on wallet row.`);
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Push wallet changes (bets, payouts, deposits from M-Pesa, anything) to `onChange`.
 * Needs Realtime enabled on the wallet table + an RLS SELECT policy for the owner.
 * Returns an unsubscribe function.
 */
export function subscribeWalletBalance(
  userId: string,
  onChange: (balance: number) => void,
): () => void {
  const channel = supabase
    .channel(`wallet:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: WALLET_TABLE,
        filter: `${WALLET_USER_COL}=eq.${userId}`,
      },
      (payload: { new?: Record<string, unknown> }) => {
        const next = Number(payload.new?.[WALLET_BALANCE_COL]);
        if (Number.isFinite(next)) onChange(next);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC: start_game
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a new game round.
 *
 * Calls `public.start_game(p_stake, p_game_name)`.
 * Server deducts the stake from the wallet, generates and stores the multiplier,
 * but does NOT return it — the client never sees the crash point until settlement.
 */
export async function startGame(
  stake: number,
  gameName: string = 'aviator',
): Promise<StartGameResult> {
  if (!Number.isFinite(stake) || stake <= 0) {
    throw new AviatorError('invalid_stake', 'Stake must be greater than 0.');
  }

  const { data, error } = await supabase
    .rpc('start_game', { p_stake: stake, p_game_name: gameName })
    .single<StartGameResult>();

  if (error) throw mapError(error.message);
  if (!data) throw new AviatorError('unknown', 'No session returned.');

  // Defensive guard: multiplier must NEVER leak from start_game.
  if ('multiplier' in (data as Record<string, unknown>)) {
    // eslint-disable-next-line no-console
    console.error('[aviator] SECURITY: start_game leaked multiplier to client!', data);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC: settle_game
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Settle an active game round.
 *
 * - `cashout` reveals the crash point and validates `claimed` against it server-side.
 * - `bust` marks the round lost with zero payout.
 *
 * Idempotent: re-calling on a settled session returns the original result.
 */
export async function settleGame(
  sessionId: string,
  action: SettleAction,
  claimed?: number,
): Promise<SettleGameResult> {
  if (!sessionId) {
    throw new AviatorError('session_not_found', 'Missing session id.');
  }
  if (action !== 'cashout' && action !== 'bust') {
    throw new AviatorError('invalid_action', 'Invalid settlement action.');
  }
  if (
    action === 'cashout' &&
    (claimed == null || !Number.isFinite(claimed) || claimed < 1)
  ) {
    throw new AviatorError('invalid_stake', 'Invalid cashout multiplier.');
  }

  const { data, error } = await supabase
    .rpc('settle_game', {
      p_session_id: sessionId,
      p_action: action,
      p_claimed: action === 'cashout' ? claimed : null,
    })
    .single<SettleGameResult>();

  if (error) throw mapError(error.message);
  if (!data) throw new AviatorError('unknown', 'No settlement returned.');

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read helper (for history UI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the current user's recent sessions. Relies on the
 * `sessions_self_read` RLS policy (SELECT-only).
 */
export async function fetchRecentSessions(
  limit: number = 20,
): Promise<SessionHistoryRow[]> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select(
      'id, game_name, stake, multiplier, status, payout, created_at, settled_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw mapError(error.message);
  return (data ?? []) as SessionHistoryRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: one settle per round, guaranteed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start a round and return handlers that settle it exactly once.
 * Guards against the UI accidentally firing both cashout and bust.
 */
export async function beginSettledRound(
  stake: number,
  gameName: string = 'aviator',
): Promise<{
  session: StartGameResult;
  cashout: (claimed: number) => Promise<SettleGameResult>;
  bust: () => Promise<SettleGameResult>;
  settled: () => boolean;
}> {
  const session = await startGame(stake, gameName);
  let done = false;

  const run = async (fn: () => Promise<SettleGameResult>) => {
    if (done) {
      throw new AviatorError('already_settled', 'Round already settled.');
    }
    done = true;
    return fn();
  };

  return {
    session,
    cashout: (claimed) =>
      run(() => settleGame(session.session_id, 'cashout', claimed)),
    bust: () => run(() => settleGame(session.session_id, 'bust')),
    settled: () => done,
  };
}