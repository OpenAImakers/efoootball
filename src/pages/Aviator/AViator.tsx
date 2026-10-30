// AviatorTab.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/ExternalHeader';
import { supabase } from '../../supabase';
import { AviatorEngine } from './AviatorEngine';
import { startGame, settleGame, AviatorError, type SettleGameResult } from './aviator';

type EngineState = ReturnType<AviatorEngine['getState']>;

type SettleState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'won'; cashoutAt: number; payout: number; crashPoint: number }
  | { status: 'lost'; crashPoint: number }
  | { status: 'error'; message: string };

const BET_AMOUNT = 100;

// Local crash point, used ONLY to drive the animation.
// The server's settle_game is what actually decides win/loss.
const localCrashPoint = (): number => {
  const HOUSE_EDGE = 0.03;
  const r = Math.random();
  if (r < HOUSE_EDGE) return 1.0;
  const raw = (1 - HOUSE_EDGE) / (1 - r);
  return Math.max(1.0, Math.min(raw, 100));
};

const AviatorTab: React.FC = () => {
  const navigate = useNavigate();
  const engineRef = useRef<AviatorEngine | null>(null);
  const [state, setState] = useState<EngineState | null>(null);
  const [settleState, setSettleState] = useState<SettleState>({ status: 'idle' });
  const [betError, setBetError] = useState<string | null>(null);
  // null = still checking, so we don't flash "Sign in" at logged-in users
  const [authed, setAuthed] = useState<boolean | null>(null);

  // ── Auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (alive) setAuthed(!!session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Engine (runs for everyone so guests can watch) ─────────────────────
  useEffect(() => {
    const engine = new AviatorEngine({
      betAmount: BET_AMOUNT,

      // Server session is opened ONLY when the player actually bets.
      onBet: async () => {
        const session = await startGame(BET_AMOUNT, 'aviator');
        return { sessionId: session.session_id };
      },

      // Called ONLY for rounds where a bet was placed.
      onSettle: async (payload: {
        sessionId: string | null;
        cashoutAt: number | null;
        lostBet: boolean;
      }) => {
        if (!payload.sessionId) return;
        setSettleState({ status: 'pending' });
        try {
          const result: SettleGameResult = await settleGame(
            payload.sessionId,
            payload.lostBet ? 'bust' : 'cashout',
            payload.cashoutAt ?? undefined,
          );
          if (result.status === 'won') {
            setSettleState({
              status: 'won',
              cashoutAt: result.cashout_at ?? 0,
              payout: result.payout,
              crashPoint: result.multiplier,
            });
          } else {
            setSettleState({ status: 'lost', crashPoint: result.multiplier });
          }
        } catch (err) {
          const msg = err instanceof AviatorError ? err.message : 'Settlement failed.';
          setSettleState({ status: 'error', message: msg });
        }
      },
    });

    // Give the engine its animation crash point per round.
    // (Engine generates one itself; override it here so both stay in one place.)
    engine.on('round', () => {
      engine.crashPoint = localCrashPoint();
    });

    engineRef.current = engine;
    const unsub = engine.on('state', setState);
    const unsubErr = engine.on('error', (err: unknown) => {
      if (err instanceof AviatorError && err.code === 'not_authenticated') {
        setBetError('Please sign in to play.');
        return;
      }
      setBetError(err instanceof Error ? err.message : 'Engine error.');
    });

    setState(engine.getState());
    engine.start();

    return () => {
      unsub();
      unsubErr();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  if (!state) return null;

  const {
    balance, multiplier, phase, hasBet, betPending, betEntry,
    yourMultiplier, cashedOutAt, autoCashout, history, potentialPayout,
  } = state;

  // ── View helpers ───────────────────────────────────────────────────────
  const svgWidth = 600;
  const svgHeight = 260;
  const progressX = Math.min((multiplier / 10) * svgWidth, svgWidth - 40);
  const progressY = Math.max(svgHeight - (multiplier / 10) * (svgHeight - 40), 20);

  const placeBet = async () => {
    setBetError(null);
    setSettleState({ status: 'idle' });
    await engineRef.current?.placeBet();
  };
  const manualCashOut = () => engineRef.current?.cashOut();
  const onAutoChange = (v: number | '') =>
    engineRef.current?.setAutoCashout(v === '' ? null : v);

  const canBet = phase === 'running' && balance >= BET_AMOUNT && !betPending;
  const joinedMid = hasBet && betEntry != null && betEntry > 1.02;

  // ── Action button ──────────────────────────────────────────────────────
  const renderAction = () => {
    if (authed === null) {
      return (
        <button type="button" disabled style={{ ...styles.bigBtn, backgroundColor: '#334155', opacity: 0.5, cursor: 'default' }}>
          Checking session…
        </button>
      );
    }

    if (!authed) {
      return (
        <button
          type="button"
          onClick={() => navigate('/auth')}
          style={{ ...styles.bigBtn, backgroundColor: '#2563EB', boxShadow: '0 10px 30px rgba(37,99,235,0.45)' }}
        >
          Sign in to play
        </button>
      );
    }

    if (!hasBet) {
      const label = betPending
        ? 'Placing bet…'
        : phase === 'running'
          ? `Place Bet · KSh ${BET_AMOUNT}${multiplier > 1.05 ? ` · joins at ${multiplier.toFixed(2)}x` : ''}`
          : 'Next flight starting…';
      return (
        <button
          type="button"
          onClick={placeBet}
          disabled={!canBet}
          style={{
            ...styles.bigBtn,
            backgroundColor: '#16A34A',
            boxShadow: '0 10px 30px rgba(22,163,74,0.4)',
            opacity: canBet ? 1 : 0.4,
            cursor: canBet ? 'pointer' : 'default',
          }}
        >
          {label}
        </button>
      );
    }

    if (cashedOutAt == null) {
      return (
        <button
          type="button"
          onClick={manualCashOut}
          disabled={phase !== 'running'}
          style={{
            ...styles.bigBtn,
            backgroundColor: '#D97706',
            boxShadow: '0 10px 35px rgba(245,158,11,0.6)',
            opacity: phase === 'running' ? 1 : 0.5,
          }}
        >
          CASH OUT · KSh {potentialPayout.toLocaleString()}
        </button>
      );
    }

    return (
      <button type="button" disabled style={{ ...styles.bigBtn, backgroundColor: 'rgba(34,197,94,0.3)', cursor: 'default' }}>
        Cashed out at {cashedOutAt.toFixed(2)}x · KSh {Math.round(BET_AMOUNT * cashedOutAt).toLocaleString()}
      </button>
    );
  };

  // ── Result card (below the game panel, not inside it) ──────────────────
  const renderResult = () => {
    if (settleState.status === 'idle') return null;

    if (settleState.status === 'pending') {
      return (
        <div style={{ ...styles.resultCard, ...styles.resultPending }}>
          <div style={styles.resultTitle}>Settling…</div>
          <div style={styles.resultDetail}>Confirming your round with the server</div>
        </div>
      );
    }

    if (settleState.status === 'won') {
      return (
        <div style={{ ...styles.resultCard, ...styles.resultWon }}>
          <div style={{ ...styles.resultTitle, color: '#22C55E' }}>YOU WON</div>
          <div style={styles.resultPayout}>+KSh {settleState.payout.toLocaleString()}</div>
          <div style={styles.resultDetail}>
            Cashed out at {settleState.cashoutAt.toFixed(2)}x · Crash point {settleState.crashPoint.toFixed(2)}x
          </div>
        </div>
      );
    }

    if (settleState.status === 'lost') {
      return (
        <div style={{ ...styles.resultCard, ...styles.resultLost }}>
          <div style={{ ...styles.resultTitle, color: '#EF4444' }}>YOU LOST</div>
          <div style={styles.resultDetail}>
            Flew away at {settleState.crashPoint.toFixed(2)}x · −KSh {BET_AMOUNT}
          </div>
        </div>
      );
    }

    return (
      <div style={{ ...styles.resultCard, ...styles.resultError }}>
        <div style={{ ...styles.resultTitle, color: '#FBBF24' }}>Couldn't confirm result</div>
        <div style={styles.resultDetail}>{settleState.message}</div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={{ ...styles.container, ...(phase === 'crashed' ? styles.shakeScreen : {}) }}>
          {/* History strip */}
          <div style={styles.historyRow}>
            {history.length === 0 && (
              <span style={styles.historyEmpty}>Flight history will appear here as rounds conclude</span>
            )}
            {history.map((h: any) => {
              const won = h.cashout != null;
              const lost = !!h.lost;
              const tone = won ? 'green' : lost ? 'red' : 'grey';
              const palette = {
                green: ['rgba(34,197,94,0.18)', '#22C55E', 'rgba(34,197,94,0.4)'],
                red: ['rgba(239,68,68,0.18)', '#EF4444', 'rgba(239,68,68,0.4)'],
                grey: ['rgba(148,163,184,0.15)', '#94A3B8', 'rgba(148,163,184,0.35)'],
              }[tone];
              return (
                <span
                  key={h.id}
                  style={{ ...styles.historyChip, backgroundColor: palette[0], color: palette[1], borderColor: palette[2] }}
                >
                  {won ? `${h.cashout.toFixed(2)}x` : `${h.multiplier.toFixed(2)}x`}
                </span>
              );
            })}
          </div>

          {/* Game panel */}
          <div
            style={{
              ...styles.gamePanel,
              borderColor: phase === 'crashed' ? 'rgba(239,68,68,0.8)' : 'rgba(96,165,250,0.3)',
              background: phase === 'crashed'
                ? 'radial-gradient(circle at center, rgba(239,68,68,0.3), #040914 75%)'
                : 'radial-gradient(circle at center, rgba(30,58,138,0.3), #040914 75%)',
            }}
          >
            <svg style={styles.svgOverlay} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor={phase === 'crashed' ? '#ef4444' : '#22c55e'} />
                </linearGradient>
              </defs>
              <path
                d={`M 0 ${svgHeight} Q ${progressX / 2} ${svgHeight - (svgHeight - progressY) / 2}, ${progressX} ${progressY}`}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            <div style={styles.centerStack}>
              {phase === 'running' ? (
                <>
                  <div style={styles.multiplierRunning}>{multiplier.toFixed(2)}x</div>
                  {hasBet && cashedOutAt == null && yourMultiplier != null ? (
                    <div style={styles.yourPill}>
                      You: {yourMultiplier.toFixed(2)}x{joinedMid ? ` (joined at ${betEntry!.toFixed(2)}x)` : ''}
                    </div>
                  ) : (
                    <div style={styles.flyingIndicator}>Flight in progress…</div>
                  )}
                </>
              ) : phase === 'crashed' ? (
                <>
                  <div style={styles.crashTitle}>FLEW AWAY</div>
                  <div style={styles.multiplierCrashed}>{multiplier.toFixed(2)}x</div>
                </>
              ) : (
                <div style={styles.multiplierRunning}>…</div>
              )}
            </div>

            {phase === 'running' && (
              <div
                style={{
                  ...styles.jetContainer,
                  left: `${Math.min((progressX / svgWidth) * 100, 85)}%`,
                  bottom: `${Math.max(15, (1 - progressY / svgHeight) * 75)}%`,
                }}
              >
                <i className="bi bi-airplane-fill" style={styles.jetIconAnim} />
              </div>
            )}
          </div>

          {/* Result: below the screen */}
          {renderResult()}

          {/* Auto-cashout input (in YOUR multiplier, so mid-flight joiners get what they set) */}
          <div style={styles.autoRow}>
            <label style={styles.autoLabel}>
              Auto Cashout Target:
              <input
                type="number"
                min={1.01}
                step={0.05}
                placeholder="2.00"
                value={autoCashout ?? ''}
                onChange={(e) => onAutoChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                style={styles.autoInput}
              />
              x
            </label>
          </div>

          {/* Action button */}
          <div style={styles.actionRow}>{renderAction()}</div>

          {betError && <div style={styles.errorRow}>{betError}</div>}

          <div style={styles.hintRow}>
            {authed === false
              ? 'You can watch the flights as a guest · Sign in to bet'
              : 'Join any flight, anytime · Mid-flight bets start counting from 1.00x when you join'}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #020617 0%, #091a3a 50%, #1e1b4b 100%)',
    paddingTop: 44,
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '16px 16px 48px',
  },
  shakeScreen: { animation: 'shake 0.4s ease-in-out' },
  historyRow: {
    display: 'flex', gap: 8, overflowX: 'auto',
    paddingBottom: 8, marginBottom: 10, minHeight: 34,
  },
  historyEmpty: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  historyChip: {
    flexShrink: 0, padding: '4px 12px', borderRadius: 8,
    fontSize: 12, fontWeight: 800, border: '1px solid',
  },
  gamePanel: {
    position: 'relative', borderRadius: 22, border: '2px solid', height: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 14,
    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
    transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  svgOverlay: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%', pointerEvents: 'none',
  },
  centerStack: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, zIndex: 3, textAlign: 'center',
  },
  multiplierRunning: {
    fontSize: 60, fontWeight: 900, letterSpacing: '-2px',
    color: '#60a5fa', textShadow: '0 0 25px rgba(96,165,250,0.5)', lineHeight: 1,
  },
  flyingIndicator: {
    fontSize: 12, fontWeight: 700, color: '#93c5fd',
    background: 'rgba(59,130,246,0.15)', padding: '4px 10px', borderRadius: 99,
  },
  yourPill: {
    fontSize: 12, fontWeight: 800, color: '#fbbf24',
    background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
    padding: '4px 12px', borderRadius: 99,
  },
  crashTitle: { fontSize: 16, fontWeight: 900, color: '#EF4444', letterSpacing: '1px' },
  multiplierCrashed: {
    fontSize: 44, fontWeight: 900, color: '#ef4444',
    textShadow: '0 0 30px rgba(239,68,68,0.6)', lineHeight: 1,
  },
  jetContainer: {
    position: 'absolute', transform: 'translate(-50%, 50%) rotate(-10deg)',
    zIndex: 2, transition: 'left 0.08s linear, bottom 0.08s linear',
  },
  jetIconAnim: {
    fontSize: 30, color: '#93c5fd',
    filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.8))',
  },

  // Result card (below the panel)
  resultCard: {
    borderRadius: 16, padding: '14px 16px', marginBottom: 14,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    border: '1px solid', animation: 'fadeIn 0.25s ease',
  },
  resultWon: { background: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.4)' },
  resultLost: { background: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.4)' },
  resultPending: { background: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.35)' },
  resultError: { background: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.4)' },
  resultTitle: { fontSize: 18, fontWeight: 900, letterSpacing: '1px', color: '#93c5fd' },
  resultPayout: { fontSize: 24, fontWeight: 900, color: '#fbbf24' },
  resultDetail: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textAlign: 'center' },

  autoRow: { display: 'flex', justifyContent: 'center', marginBottom: 14 },
  autoLabel: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
    color: 'rgba(255,255,255,0.7)', fontWeight: 600,
  },
  autoInput: {
    width: 85, padding: '8px 10px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)', color: '#fff',
    fontSize: 13, fontWeight: 700, textAlign: 'center', outline: 'none',
  },
  actionRow: { marginBottom: 14 },
  bigBtn: {
    width: '100%', padding: '18px 16px', borderRadius: 16, border: 'none',
    color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: '0.3px',
    cursor: 'pointer', transition: 'transform 0.1s ease, filter 0.1s ease',
  },
  hintRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center',
  },
  errorRow: {
    fontSize: 12, color: '#fca5a5', textAlign: 'center',
    marginBottom: 10, fontWeight: 600,
  },
};

export default AviatorTab;