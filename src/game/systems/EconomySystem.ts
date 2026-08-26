import {
  COIN_INTERVAL_MS,
  COINS_PER_INTERVAL,
  MAX_COINS,
} from "../constants/gameConstants";
import type { GameState } from "../types/Village";

export interface EconomyResult {
  state: GameState;
  remainderMs: number;
  coinsEarned: number;
}

export function roundCoins(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 10) / 10;
}

export function normalizeCoinBalance(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.min(MAX_COINS, Math.max(0, roundCoins(amount)));
}

export function creditCoins(
  state: GameState,
  requestedAmount: number,
): { state: GameState; coinsEarned: number } {
  const currentCoins = normalizeCoinBalance(state.coins);
  const safeAmount = Number.isFinite(requestedAmount) ? Math.max(0, requestedAmount) : 0;
  const nextCoins = normalizeCoinBalance(currentCoins + safeAmount);
  const coinsEarned = roundCoins(nextCoins - currentCoins);
  return {
    state: nextCoins === state.coins ? state : { ...state, coins: nextCoins },
    coinsEarned,
  };
}

export function advanceEconomy(
  state: GameState,
  elapsedMs: number,
  remainderMs = 0,
): EconomyResult {
  const totalElapsed = Math.max(0, remainderMs + elapsedMs);
  const payoutCount = Math.floor(totalElapsed / COIN_INTERVAL_MS);
  const credit = payoutCount === 0
    ? { state, coinsEarned: 0 }
    : creditCoins(state, roundCoins(payoutCount * COINS_PER_INTERVAL));
  return {
    state: credit.state,
    remainderMs: totalElapsed % COIN_INTERVAL_MS,
    coinsEarned: credit.coinsEarned,
  };
}
