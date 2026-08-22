import {
  PIG_PORK_AMOUNT,
  PIG_PORK_INTERVAL_MS,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { PigProduction } from "../types/Pig";
import type { GameState } from "../types/Village";
import { createLivestockProductionModule } from "./LivestockProductionSystem";

export type PigPorkOutcome = "collected" | "not-ready" | "not-found";

export interface PigPorkResult {
  outcome: PigPorkOutcome;
  state: GameState;
}

const pigProductionModule = createLivestockProductionModule<PigProduction>({
  buildingId: "pig",
  stateKey: "pigProductions",
  readyAtKey: "porkReadyAt",
  inventoryKey: "pork",
  intervalMs: PIG_PORK_INTERVAL_MS,
  amount: PIG_PORK_AMOUNT,
});

export function isPigPorkReady(production: PigProduction, now: number): boolean {
  return pigProductionModule.isReady(production, now);
}

export function registerPigProduction(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): GameState {
  return pigProductionModule.register(state, buildingInstanceId, now);
}

export function removePigProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return pigProductionModule.remove(state, buildingInstanceId);
}

export function collectPigPork(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): PigPorkResult {
  return pigProductionModule.collect(state, buildingInstanceId, now);
}

export function normalizePigProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): PigProduction[] {
  return pigProductionModule.normalize(value, buildings, now);
}
