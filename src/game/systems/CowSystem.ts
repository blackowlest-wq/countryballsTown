import {
  COW_MILK_AMOUNT,
  COW_MILK_INTERVAL_MS,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { CowProduction } from "../types/Cow";
import type { GameState } from "../types/Village";
import { createLivestockProductionModule } from "./LivestockProductionSystem";

export type CowMilkOutcome = "collected" | "not-ready" | "not-found";

export interface CowMilkResult {
  outcome: CowMilkOutcome;
  state: GameState;
}

const cowProductionModule = createLivestockProductionModule<CowProduction>({
  buildingId: "cow",
  stateKey: "cowProductions",
  readyAtKey: "milkReadyAt",
  inventoryKey: "milk",
  intervalMs: COW_MILK_INTERVAL_MS,
  amount: COW_MILK_AMOUNT,
});

export function isCowMilkReady(production: CowProduction, now: number): boolean {
  return cowProductionModule.isReady(production, now);
}

export function registerCowProduction(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): GameState {
  return cowProductionModule.register(state, buildingInstanceId, now);
}

export function removeCowProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return cowProductionModule.remove(state, buildingInstanceId);
}

export function collectCowMilk(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): CowMilkResult {
  return cowProductionModule.collect(state, buildingInstanceId, now);
}

export function normalizeCowProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): CowProduction[] {
  return cowProductionModule.normalize(value, buildings, now);
}
