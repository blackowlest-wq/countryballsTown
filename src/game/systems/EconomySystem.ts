import { COIN_INTERVAL_MS, COINS_PER_INTERVAL } from "../constants/gameConstants";
import type { GameState } from "../types/Village";

export interface EconomyResult {
  state: GameState;
  remainderMs: number;
  coinsEarned: number;
}

export function roundCoins(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 10) / 10;
}

export function advanceEconomy(
  state: GameState,
  elapsedMs: number,
  remainderMs = 0,
): EconomyResult {
  const totalElapsed = Math.max(0, remainderMs + elapsedMs);
  const payoutCount = Math.floor(totalElapsed / COIN_INTERVAL_MS);
  const coinsEarned = roundCoins(payoutCount * COINS_PER_INTERVAL);
  return {
    state:
      payoutCount === 0
        ? state
        : { ...state, coins: roundCoins(state.coins + coinsEarned) },
    remainderMs: totalElapsed % COIN_INTERVAL_MS,
    coinsEarned,
  };
}
