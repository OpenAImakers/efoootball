// AviatorTab.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../../components/ExternalHeader';
import { AviatorEngine, type AviatorEngine as Engine } from './AviatorEngine';
import { startGame, settleGame, AviatorError, type SettleGameResult } from './aviator';
type EngineState = ReturnType<Engine['getState']>;

type SettleState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'won'; cashoutAt: number; payout: number; crashPoint: number }
  | { status: 'lost'; crashPoint: number }
  | { status: 'error'; message: string };

// Local crash-point generator used ONLY for animation when the server
// doesn't reveal the real one. Matches the old distribution so the
// animation feels similar. The server's settle_game is what actually
// decides win/loss.
const localCrashPoint = (): number => {
  const HOUSE_EDGE = 0.03;
  const r = Math.random();
  if (r < HOUSE_EDGE) return 1.0;
  const raw = (1 - HOUSE_EDGE) / (1 - r);
  return Math.max(1.0, Math.min(raw, 100));
};

const AviatorTab: React.FC = () => {
  const engineRef = useRef<AviatorEngine | null>(null);
  const [state, setState] = useState<EngineState | null>(null);
  const [settleState, setSettleState] = useState<SettleState>({ status: 'idle' });
  const [betError, setBetError] = useState<string | null>(null);
  const settlingRef = useRef(false);

  // Create the engine once, subscribe, and start.
  useEffect(() => {
    const engine = new AviatorEngine({
      roundProvider: async () => {
        // Open a server-side session. The real crash point stays server-side.
        const session = await startGame(100, 'aviator');
        return {
          sessionId: session.session_id,
          // Local stand-in used only for the animation; server decides truth.
          crashPoint: localCrashPoint(),
        };
      },
      onSettle: async (payload) => {
        if (!payload.sessionId) return;
        if (settlingRef.current) return;
        settlingRef.current = true;
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
        } finally {
          // Reset the "one settle per round" guard after settlement completes.
          // The next `_beginRound` will open a fresh session.
          settlingRef.current = false;
        }
      },
    });
    engineRef.current = engine;

    const unsub = engine.on('state', setState);
    const unsubErr = engine.on('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Engine error.';
      setBetError(msg);
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
    balance, multiplier, phase,
    hasBet, cashedOutAt, autoCashout, history, potentialPayout,
  } = state;

  // --- derived view helpers (unchanged) ---
  const svgWidth = 600;
  const svgHeight = 260;
  const progressX = Math.min((multiplier / 10) * svgWidth, svgWidth - 40);
  const progressY = Math.max(svgHeight - (multiplier / 10) * (svgHeight - 40), 20);

  const placeBet = () => {
    setBetError(null);
    setSettleState({ status: 'idle' });
    engineRef.current?.placeBet();
  };
  const manualCashOut = () => engineRef.current?.cashOut();
  const onAutoChange = (v: number | '') =>
    engineRef.current?.setAutoCashout(v === '' ? null : v);

  // Show the settle overlay only when a round just settled.
  const showSettleOverlay =
    settleState.status === 'won' ||
    settleState.status === 'lost' ||
    settleState.status === 'error';

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
            {history.map((h) => (
              <span
                key={h.id}
                style={{
                  ...styles.historyChip,
                  backgroundColor: h.cashout != null ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                  color: h.cashout != null ? '#22C55E' : '#EF4444',
                  borderColor: h.cashout != null ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
                }}
              >
                {h.cashout != null ? `${h.cashout.toFixed(2)}x` : `${h.multiplier.toFixed(2)}x`}
              </span>
            ))}
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
                  <div style={styles.flyingIndicator}>Flight in progress...</div>
                </>
              ) : phase === 'starting' ? (
                <>
                  <div style={styles.multiplierRunning}>…</div>
                  <div style={styles.flyingIndicator}>Opening session</div>
                </>
              ) : (
                <>
                  <div style={styles.crashTitle}>CRASHED</div>
                  <div style={styles.multiplierCrashed}>{multiplier.toFixed(2)}x</div>
                </>
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

            {/* Settlement overlay: the server's verdict overrides the animation. */}
            {showSettleOverlay && (
              <div style={styles.settleOverlay}>
                {settleState.status === 'won' && (
                  <>
                    <div style={styles.settleWon}>WON</div>
                    <div style={styles.settleDetail}>
                      Cashed out at {settleState.cashoutAt.toFixed(2)}x
                    </div>
                    <div style={styles.settlePayout}>
                      +KSh {settleState.payout.toLocaleString()}
                    </div>
                    <div style={styles.settleCrash}>
                      Crash point: {settleState.crashPoint.toFixed(2)}x
                    </div>
                  </>
                )}
                {settleState.status === 'lost' && (
                  <>
                    <div style={styles.settleLost}>LOST</div>
                    <div style={styles.settleDetail}>
                      Crash point: {settleState.crashPoint.toFixed(2)}x
                    </div>
                  </>
                )}
                {settleState.status === 'error' && (
                  <>
                    <div style={styles.settleLost}>SETTLE ERROR</div>
                    <div style={styles.settleDetail}>{settleState.message}</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Auto-cashout input */}
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
          <div style={styles.actionRow}>
            {!hasBet ? (
              <button
                type="button"
                onClick={placeBet}
                disabled={balance < 100 || phase !== 'running'}
                style={{
                  ...styles.bigBtn,
                  backgroundColor: '#16A34A',
                  boxShadow: '0 10px 30px rgba(22,163,74,0.4)',
                  opacity: balance < 100 || phase !== 'running' ? 0.4 : 1,
                }}
              >
                Place Bet · KSh 100
              </button>
            ) : cashedOutAt == null ? (
              <button
                type="button"
                onClick={manualCashOut}
                style={{
                  ...styles.bigBtn,
                  backgroundColor: '#D97706',
                  boxShadow: '0 10px 35px rgba(245,158,11,0.6)',
                }}
              >
                CASH OUT · KSh {potentialPayout.toLocaleString()}
              </button>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  ...styles.bigBtn,
                  backgroundColor: 'rgba(34,197,94,0.3)',
                  cursor: 'default',
                }}
              >
                Cashed Out at {cashedOutAt.toFixed(2)}x (Won KSh {Math.round(100 * cashedOutAt)})
              </button>
            )}
          </div>

          {betError && (
            <div style={styles.errorRow}>{betError}</div>
          )}

          <div style={styles.hintRow}>
            {settleState.status === 'pending'
              ? 'Settling round with server…'
              : 'Continuous flight engine active · Place bets anytime'}
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
      `}</style>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  /* ...unchanged from your file — keep every existing key... */
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
    overflow: 'hidden', marginBottom: 16,
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
  settleOverlay: {
    position: 'absolute', inset: 0, display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 4, zIndex: 4,
    background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(2px)',
    animation: 'fadeIn 0.2s ease',
  },
  settleWon: { fontSize: 26, fontWeight: 900, color: '#22C55E', letterSpacing: '1px' },
  settleLost: { fontSize: 26, fontWeight: 900, color: '#EF4444', letterSpacing: '1px' },
  settleDetail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 },
  settlePayout: { fontSize: 22, fontWeight: 900, color: '#fbbf24' },
  settleCrash: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
};

export default AviatorTab;