import { COIN_INTERVAL_MS, COINS_PER_INTERVAL } from "../constants/gameConstants";
import type { GameState } from "../types/Village";

export interface EconomyResult {
  state: GameState;
  remainderMs: number;
  coinsEarned: number;
}

export function advanceEconomy(
  state: GameState,
  elapsedMs: number,
  remainderMs = 0,
): EconomyResult {
  const totalElapsed = Math.max(0, remainderMs + elapsedMs);
  const payoutCount = Math.floor(totalElapsed / COIN_INTERVAL_MS);
  return {
    state:
      payoutCount === 0
        ? state
        : { ...state, coins: state.coins + payoutCount * COINS_PER_INTERVAL },
    remainderMs: totalElapsed % COIN_INTERVAL_MS,
    coinsEarned: payoutCount * COINS_PER_INTERVAL,
  };
}
