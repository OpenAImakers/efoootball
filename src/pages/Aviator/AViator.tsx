// AviatorTab.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../../components/ExternalHeader';

type Phase = 'running' | 'crashed';

type HistoryEntry = {
  id: number;
  multiplier: number;
  cashout: number | null;
  at: number;
};

const START_BALANCE = 10_000;
const BET = 100;
const HOUSE_EDGE = 0.03;

const generateCrashPoint = (): number => {
  const r = Math.random();
  if (r < HOUSE_EDGE) return 1.0;
  const raw = (1 - HOUSE_EDGE) / (1 - r);
  return Math.max(1.0, Math.min(raw, 100));
};

const AviatorTab: React.FC = () => {
  const [balance, setBalance] = useState(START_BALANCE);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(generateCrashPoint());
  const [phase, setPhase] = useState<Phase>('running');
  
  // Betting status for current round
  const [hasBet, setHasBet] = useState(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [autoCashout, setAutoCashout] = useState<number | ''>('');
  
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Handle crash / round end and immediately roll into the next flight loop
  const triggerCrash = useCallback((finalMult: number) => {
    stopLoop();
    setPhase('crashed');
    setMultiplier(finalMult);

    // If user had a bet active and didn't cash out before crash -> lost
    setHasBet((prevBet) => {
      if (prevBet && cashedOutAt == null) {
        setHistory((h) => [{ id: Date.now(), multiplier: finalMult, cashout: null, at: Date.now() }, ...h].slice(0, 12));
      }
      return false; // reset bet state for next seamless flight
    });

    // Brief pause on crash screen before seamlessly restarting the next flight
    setTimeout(() => {
      setCrashPoint(generateCrashPoint());
      setCashedOutAt(null);
      setMultiplier(1.0);
      setPhase('running');
      startTimeRef.current = performance.now();
    }, 1200);
  }, [cashedOutAt, stopLoop]);

  // Main game ticker loop
  useEffect(() => {
    const tick = () => {
      if (phase === 'running') {
        const elapsed = performance.now() - startTimeRef.current;
        const m = 1.0 * Math.exp(elapsed / 4200);
        const clamped = Math.min(m, crashPoint);

        setMultiplier(clamped);

        // Auto cashout logic
        const auto = typeof autoCashout === 'number' ? autoCashout : null;
        if (hasBet && cashedOutAt == null && auto && clamped >= auto && clamped < crashPoint) {
          setCashedOutAt(auto);
          const payout = Math.round(BET * auto);
          setBalance((b) => b + payout);
          setHistory((h) => [{ id: Date.now(), multiplier: crashPoint, cashout: auto, at: Date.now() }, ...h].slice(0, 12));
        }

        if (clamped >= crashPoint) {
          triggerCrash(crashPoint);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => stopLoop();
  }, [phase, crashPoint, autoCashout, hasBet, cashedOutAt, triggerCrash, stopLoop]);

  const placeBet = () => {
    if (hasBet || balance < BET) return;
    setBalance((b) => b - BET);
    setHasBet(true);
    setCashedOutAt(null);
  };

  const manualCashOut = () => {
    if (!hasBet || cashedOutAt != null || phase !== 'running') return;
    setCashedOutAt(multiplier);
    const payout = Math.round(BET * multiplier);
    setBalance((b) => b + payout);
    setHistory((h) => [{ id: Date.now(), multiplier: crashPoint, cashout: multiplier, at: Date.now() }, ...h].slice(0, 12));
  };

  // SVG Curve calculations
  const svgWidth = 600;
  const svgHeight = 260;
  const progressX = Math.min((multiplier / 10) * svgWidth, svgWidth - 40);
  const progressY = Math.max(svgHeight - (multiplier / 10) * (svgHeight - 40), 20);

  const potentialPayout = cashedOutAt != null ? Math.round(BET * cashedOutAt) : Math.round(BET * multiplier);

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
            {/* SVG Flight Graph Path */}
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

            {/* Center State Content */}
            <div style={styles.centerStack}>
              {phase === 'running' ? (
                <>
                  <div style={styles.multiplierRunning}>{multiplier.toFixed(2)}x</div>
                  <div style={styles.flyingIndicator}>Flight in progress...</div>
                </>
              ) : (
                <>
                  <div style={styles.crashTitle}>CRASHED</div>
                  <div style={styles.multiplierCrashed}>{multiplier.toFixed(2)}x</div>
                </>
              )}
            </div>

            {/* Flying Jet Icon */}
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

          {/* Auto-cashout input */}
          <div style={styles.autoRow}>
            <label style={styles.autoLabel}>
              Auto Cashout Target:
              <input
                type="number"
                min={1.01}
                step={0.05}
                placeholder="e.g. 2.00"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                disabled={balance < BET}
                style={{
                  ...styles.bigBtn,
                  backgroundColor: '#16A34A',
                  boxShadow: '0 10px 30px rgba(22,163,74,0.4)',
                  opacity: balance < BET ? 0.4 : 1,
                }}
              >
                Place Bet · KSh {BET}
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
                Cashed Out at {cashedOutAt.toFixed(2)}x (Won KSh {Math.round(BET * cashedOutAt)})
              </button>
            )}
          </div>

          <div style={styles.hintRow}>
            Continuous flight engine active · Place bets anytime
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
  shakeScreen: {
    animation: 'shake 0.4s ease-in-out',
  },
  historyRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 8,
    marginBottom: 10,
    minHeight: 34,
  },
  historyEmpty: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  historyChip: {
    flexShrink: 0,
    padding: '4px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    border: '1px solid',
  },
  gamePanel: {
    position: 'relative',
    borderRadius: 22,
    border: '2px solid',
    height: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
    transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  centerStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
    textAlign: 'center',
  },
  multiplierRunning: {
    fontSize: 60,
    fontWeight: 900,
    letterSpacing: '-2px',
    color: '#60a5fa',
    textShadow: '0 0 25px rgba(96,165,250,0.5)',
    lineHeight: 1,
  },
  flyingIndicator: {
    fontSize: 12,
    fontWeight: 700,
    color: '#93c5fd',
    background: 'rgba(59,130,246,0.15)',
    padding: '4px 10px',
    borderRadius: 99,
  },
  crashTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: '#EF4444',
    letterSpacing: '1px',
  },
  multiplierCrashed: {
    fontSize: 44,
    fontWeight: 900,
    color: '#ef4444',
    textShadow: '0 0 30px rgba(239,68,68,0.6)',
    lineHeight: 1,
  },
  jetContainer: {
    position: 'absolute',
    transform: 'translate(-50%, 50%) rotate(-10deg)',
    zIndex: 2,
    transition: 'left 0.08s linear, bottom 0.08s linear',
  },
  jetIconAnim: {
    fontSize: 30,
    color: '#93c5fd',
    filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.8))',
  },
  autoRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 14,
  },
  autoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 600,
  },
  autoInput: {
    width: 85,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    outline: 'none',
  },
  actionRow: {
    marginBottom: 14,
  },
  bigBtn: {
    width: '100%',
    padding: '18px 16px',
    borderRadius: 16,
    border: 'none',
    color: '#fff',
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: '0.3px',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, filter 0.1s ease',
  },
  hintRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
};

export default AviatorTab;