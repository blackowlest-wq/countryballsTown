import { FISHING_ROD_COST } from "../constants/gameConstants";
import type { GameState } from "../types/Village";

export type FishingRodPurchaseFailureReason = "already-owned" | "not-enough-coins";

export interface FishingRodPurchaseResult {
  ok: boolean;
  state: GameState;
  reason?: FishingRodPurchaseFailureReason;
}

export function canStartFishing(state: GameState): boolean {
  return state.hasFishingRod;
}

export function canPurchaseFishingRod(state: GameState): boolean {
  return !state.hasFishingRod && Number.isFinite(state.coins) && state.coins >= FISHING_ROD_COST;
}

export function purchaseFishingRod(state: GameState): FishingRodPurchaseResult {
  if (state.hasFishingRod) {
    return { ok: false, state, reason: "already-owned" };
  }
  if (!canPurchaseFishingRod(state)) {
    return { ok: false, state, reason: "not-enough-coins" };
  }
  return {
    ok: true,
    state: {
      ...state,
      coins: state.coins - FISHING_ROD_COST,
      hasFishingRod: true,
    },
  };
}
