// AviatorEngine.js
// Framework-agnostic Aviator game engine.
// No React, no DOM — pure logic + an event emitter.
// Swap the loop driver (RAF in browser, setInterval in tests/Node) via the scheduler helpers at the bottom.
//
// Rounds run continuously. A player can bet at ANY point while a round is flying.
// If they join at 1.20x, their own multiplier starts at 1.00x from that moment
// (see effectiveMultiplier) — so cashing out at 2.00x pays 1.80x.

export const DEFAULT_CONFIG = {
  startBalance: 10_000,
  betAmount: 100, // default stake
  minBet: 5,
  maxBet: 10_000,
  houseEdge: 0.03,
  maxMultiplier: 100,
  curveMs: 4200,
  crashPauseMs: 1200,
  historyLimit: 12,

  // Async. Called when the player places a bet — open the server session here.
  // Signature: (stake: number) => Promise<{ sessionId: string }>
  onBet: null,

  // Called when a BET resolves (cashout or bust). Never called for rounds with no bet.
  // Signature: ({ sessionId, crashPoint, cashoutAt, lostBet }) => Promise<void>
  onSettle: null,
};

/**
 * Multiplier a player actually earns when they joined mid-flight.
 * They "restart" at 1.00x from their entry point: 1 + (current - entry).
 * Join at 1.20x, now at 2.00x  ->  1.80x.
 *
 * (Want strict ratio math instead? return current / entry. Same call site, one line.)
 */
export const effectiveMultiplier = (entry, current) => {
  if (entry == null) return current;
  return Math.max(1, 1 + (current - entry));
};

/**
 * Events emitted:
 *   'state'   -> full snapshot
 *   'round'   -> { roundId }
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
    this.phase = 'idle'; // 'idle' | 'running' | 'crashed'
    this.hasBet = false;
    this.betPending = false;
    this.stake = this.config.betAmount; // what the NEXT bet will be
    this.betStake = null; // stake locked in for the CURRENT bet
    this.betEntry = null; // raw multiplier at the moment the bet was confirmed
    this.cashedOutAt = null; // effective multiplier the player exited at
    this.autoCashout = null;
    this.sessionId = null;
    this.history = [];

    this._roundId = 0;
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
      betPending: this.betPending,
      stake: this.stake,
      betStake: this.betStake,
      minBet: this.config.minBet,
      maxBet: this.config.maxBet,
      betEntry: this.betEntry,
      yourMultiplier: this._yourMultiplier(),
      cashedOutAt: this.cashedOutAt,
      autoCashout: this.autoCashout,
      sessionId: this.sessionId,
      history: this.history,
      potentialPayout: this._potentialPayout(),
      canBet: this._canPlaceBet(),
    };
  }

  // ---------- player actions ----------

  setAutoCashout(value) {
    this.autoCashout = typeof value === 'number' && value > 1 ? value : null;
    this._emitState();
  }

  /**
   * Set the stake for the next bet. Locked while a bet is live or opening.
   * Returns true if accepted (value is rounded to a whole shilling).
   */
  setStake(value) {
    if (this.hasBet || this.betPending) return false;
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return false;
    const { minBet, maxBet } = this.config;
    this.stake = Math.min(Math.max(n, 0), maxBet);
    this._emitState();
    return n >= minBet && n <= maxBet;
  }

  _stakeValid() {
    return this.stake >= this.config.minBet && this.stake <= this.config.maxBet;
  }

  /**
   * Place a bet at any point while the round is flying.
   * Opens a server session via config.onBet, then locks in the entry multiplier
   * at the moment the server confirms (so slow networks can't buy a cheaper entry).
   */
  async placeBet() {
    if (!this._canPlaceBet()) return false;

    const roundId = this._roundId;
    const stake = this.stake; // lock it now; the input can't change it mid-request
    this.betPending = true;
    this._emitState();

    let sessionId = null;
    try {
      if (this.config.onBet) {
        const res = await this.config.onBet(stake);
        sessionId = res?.sessionId ?? null;
      }
    } catch (err) {
      this.betPending = false;
      this._emit('error', err);
      return false;
    }

    this.betPending = false;

    // The round crashed while the server was opening the session.
    // The session exists, so close it out as a lost bet.
    if (roundId !== this._roundId || this.phase !== 'running') {
      this._settle({
        sessionId,
        stake,
        crashPoint: this.crashPoint,
        cashoutAt: null,
        lostBet: true,
      });
      this._emitState();
      return false;
    }

    this.sessionId = sessionId;
    this.balance -= stake;
    this.betStake = stake;
    this.hasBet = true;
    this.betEntry = this.multiplier;
    this.cashedOutAt = null;
    this._emitState();
    return true;
  }

  cashOut() {
    if (!this.hasBet || this.cashedOutAt != null || this.phase !== 'running') {
      return null;
    }
    // Floor to 2dp so what the player sees == what the server pays.
    const at = Math.floor(effectiveMultiplier(this.betEntry, this.multiplier) * 100) / 100;
    const payout = Math.round(this.betStake * at);
    this.cashedOutAt = at;
    this.balance += payout;

    this._emit('cashout', { at, payout });
    this._settle({
      sessionId: this.sessionId,
      stake: this.betStake,
      crashPoint: this.crashPoint,
      cashoutAt: at,
      lostBet: false,
    });
    return { at, payout };
  }

  // ---------- internals ----------

  _canPlaceBet() {
    return (
      this.phase === 'running' &&
      !this.hasBet &&
      !this.betPending &&
      this._stakeValid() &&
      this.balance >= this.stake
    );
  }

  _beginRound() {
    this._roundId += 1;
    this.crashPoint = this._generateCrashPoint();
    this.multiplier = 1.0;
    this.phase = 'running';
    this.hasBet = false;
    this.betEntry = null;
    this.betStake = null;
    this.cashedOutAt = null;
    this.sessionId = null;
    this._startTime = now();
    this._emit('round', { roundId: this._roundId });
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

    // Auto-cashout target is in the PLAYER's terms (their own multiplier).
    if (
      this.hasBet &&
      this.cashedOutAt == null &&
      this.autoCashout != null &&
      clamped < this.crashPoint &&
      effectiveMultiplier(this.betEntry, clamped) >= this.autoCashout
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
    const payload = {
      sessionId: this.sessionId,
      stake: this.betStake,
      crashPoint: this.crashPoint,
      cashoutAt: this.cashedOutAt,
      lostBet,
    };

    this._pushHistory({
      multiplier: this.crashPoint,
      cashout: this.cashedOutAt,
      lost: lostBet,
    });
    this.hasBet = false;
    this.betEntry = null;

    this._emit('crash', payload);

    // A cashout already settled itself. Only a lost bet needs settling here.
    if (lostBet) this._settle(payload);

    this._pauseTimer = setTimeout(() => {
      this._pauseTimer = null;
      if (!this._running) return;
      this._beginRound();
    }, this.config.crashPauseMs);
  }

  _settle(payload) {
    if (!this.config.onSettle) return;
    Promise.resolve()
      .then(() => this.config.onSettle(payload))
      .catch((e) => this._emit('error', e));
  }

  _pushHistory(entry) {
    this.history = [
      { id: Date.now() + Math.random(), at: Date.now(), ...entry },
      ...this.history,
    ].slice(0, this.config.historyLimit);
  }

  _yourMultiplier() {
    if (!this.hasBet) return null;
    return this.cashedOutAt ?? effectiveMultiplier(this.betEntry, this.multiplier);
  }

  _potentialPayout() {
    const mine = this._yourMultiplier();
    return mine == null ? 0 : Math.round(this.betStake * mine);
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