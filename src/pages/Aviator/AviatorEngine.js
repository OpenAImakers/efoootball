// AviatorEngine.js
// Framework-agnostic Aviator game engine.
// No React, no DOM — pure logic + an event emitter.
// Swap the loop driver (RAF in browser, setInterval in tests/Node) via the `scheduler` option.

export const DEFAULT_CONFIG = {
  startBalance: 10_000,
  betAmount: 100,
  houseEdge: 0.03,
  maxMultiplier: 100,
  curveMs: 4200,
  crashPauseMs: 1200,
  historyLimit: 12,

  // Async provider returning the crash point for the next round.
  // Signature: () => Promise<{ sessionId: string, crashPoint: number }>
  roundProvider: null,

  // Called after the round settles so the host can persist it.
  // Signature: (payload) => Promise<void>
  onSettle: null,
};

/**
 * Events emitted:
 *   'state'   -> full snapshot
 *   'round'   -> { sessionId, crashPoint }
 *   'cashout' -> { at, payout }
 *   'crash'   -> { sessionId, crashPoint, cashoutAt, lostBet }
 *   'error'   -> Error
 */
export class AviatorEngine {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._listeners = new Map();

    this.balance = this.config.startBalance;
    this.multiplier = 1.0;
    this.crashPoint = this._generateCrashPoint();
    this.phase = 'idle'; // 'idle' | 'starting' | 'running' | 'crashed'
    this.hasBet = false;
    this.cashedOutAt = null;
    this.autoCashout = null;
    this.sessionId = null;
    this.history = [];

    this._startTime = 0;
    this._rafId = null;
    this._pauseTimer = null;
    this._running = false;
  }

  // ---------- lifecycle ----------

  start() {
    if (this._running) return;
    this._running = true;
    this._beginRound();
  }

  stop() {
    this._running = false;
    this._cancelLoop();
    if (this._pauseTimer != null) {
      clearTimeout(this._pauseTimer);
      this._pauseTimer = null;
    }
  }

  destroy() {
    this.stop();
    this._listeners.clear();
  }

  // ---------- events ----------

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this._listeners.get(event)?.delete(fn);
  }

  _emit(event, payload) {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
    if (event !== 'state') this._emitState();
  }

  _emitState() {
    const snap = this.getState();
    this._listeners.get('state')?.forEach((fn) => fn(snap));
  }

  // ---------- snapshot ----------

  getState() {
    return {
      balance: this.balance,
      multiplier: this.multiplier,
      crashPoint: this.crashPoint,
      phase: this.phase,
      hasBet: this.hasBet,
      cashedOutAt: this.cashedOutAt,
      autoCashout: this.autoCashout,
      sessionId: this.sessionId,
      history: this.history,
      potentialPayout: this._potentialPayout(),
      canBet:
        !this.hasBet &&
        this.balance >= this.config.betAmount &&
        this.phase === 'running',
    };
  }

  // ---------- player actions ----------

  setAutoCashout(value) {
    this.autoCashout = typeof value === 'number' && value > 1 ? value : null;
    this._emitState();
  }

  placeBet() {
    if (this.phase !== 'running') return false;
    if (this.hasBet || this.balance < this.config.betAmount) return false;
    this.balance -= this.config.betAmount;
    this.hasBet = true;
    this.cashedOutAt = null;
    this._emitState();
    return true;
  }

  cashOut() {
    if (!this.hasBet || this.cashedOutAt != null || this.phase !== 'running') {
      return null;
    }
    const at = this.multiplier;
    const payout = Math.round(this.config.betAmount * at);
    this.cashedOutAt = at;
    this.balance += payout;
    this._pushHistory({ multiplier: this.crashPoint, cashout: at });

    const payload = {
      sessionId: this.sessionId,
      crashPoint: this.crashPoint,
      cashoutAt: at,
      lostBet: false,
    };
    this._emit('cashout', { at, payout });

    if (this.config.onSettle) {
      Promise.resolve(this.config.onSettle(payload)).catch((e) =>
        this._emit('error', e),
      );
    }
    return { at, payout };
  }

  // ---------- internals ----------

  async _beginRound() {
    this.crashPoint = 1.0;
    this.multiplier = 1.0;
    this.phase = 'starting';
    this.cashedOutAt = null;
    this.sessionId = null;
    this._emitState();

    try {
      if (this.config.roundProvider) {
        const res = await this.config.roundProvider();
        this.sessionId = res.sessionId;
        this.crashPoint = res.crashPoint;
      } else {
        this.crashPoint = this._generateCrashPoint();
      }
    } catch (err) {
      this.phase = 'idle';
      this._emit('error', err);
      this._emitState();
      return;
    }

    this.phase = 'running';
    this._startTime = now();
    this._emit('round', {
      sessionId: this.sessionId,
      crashPoint: this.crashPoint,
    });
    this._emitState();
    this._scheduleTick();
  }

  _scheduleTick() {
    this._cancelLoop();
    this._rafId = raf((t) => {
      this._rafId = null;
      if (!this._running) return;
      if (this._tick(t)) this._scheduleTick();
    });
  }

  /** Returns true if the loop should continue. */
  _tick(timestamp) {
    if (this.phase !== 'running') return false;

    const elapsed = timestamp - this._startTime;
    const raw = Math.exp(elapsed / this.config.curveMs);
    const clamped = Math.min(raw, this.crashPoint);

    this.multiplier = clamped;

    if (
      this.hasBet &&
      this.cashedOutAt == null &&
      this.autoCashout != null &&
      clamped >= this.autoCashout &&
      clamped < this.crashPoint
    ) {
      this.cashOut();
    }

    if (clamped >= this.crashPoint) {
      this._triggerCrash();
      return false;
    }

    this._emitState();
    return true;
  }

  _triggerCrash() {
    this._cancelLoop();
    this.phase = 'crashed';
    this.multiplier = this.crashPoint;

    const lostBet = this.hasBet && this.cashedOutAt == null;
    if (lostBet) {
      this._pushHistory({ multiplier: this.crashPoint, cashout: null });
    }
    this.hasBet = false;

    const payload = {
      sessionId: this.sessionId,
      crashPoint: this.crashPoint,
      cashoutAt: this.cashedOutAt,
      lostBet,
    };
    this._emit('crash', payload);
    this._emitState();

    if (this.config.onSettle) {
      Promise.resolve(this.config.onSettle(payload)).catch((e) =>
        this._emit('error', e),
      );
    }

    this._pauseTimer = setTimeout(() => {
      this._pauseTimer = null;
      if (!this._running) return;
      this._beginRound();
    }, this.config.crashPauseMs);
  }

  _pushHistory(entry) {
    this.history = [
      { id: Date.now() + Math.random(), at: Date.now(), ...entry },
      ...this.history,
    ].slice(0, this.config.historyLimit);
  }

  _potentialPayout() {
    const mult = this.cashedOutAt ?? this.multiplier;
    return Math.round(this.config.betAmount * mult);
  }

  _generateCrashPoint() {
    const { houseEdge, maxMultiplier } = this.config;
    const r = Math.random();
    if (r < houseEdge) return 1.0;
    const raw = (1 - houseEdge) / (1 - r);
    return Math.max(1.0, Math.min(raw, maxMultiplier));
  }

  _cancelLoop() {
    if (this._rafId != null) {
      cancelRaf(this._rafId);
      this._rafId = null;
    }
  }
}

// ---------- environment-agnostic scheduler ----------

export const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

export const raf = (cb) => {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(cb);
  return setTimeout(() => cb(now()), 16);
};

export const cancelRaf = (id) => {
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
  else clearTimeout(id);
};

export default AviatorEngine;