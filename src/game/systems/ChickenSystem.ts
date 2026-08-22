import {
  CHICKEN_EGG_AMOUNT,
  CHICKEN_EGG_INTERVAL_MS,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { ChickenProduction } from "../types/Chicken";
import type { GameState } from "../types/Village";
import { createLivestockProductionModule } from "./LivestockProductionSystem";

export type ChickenEggOutcome = "collected" | "not-ready" | "not-found";

export interface ChickenEggResult {
  outcome: ChickenEggOutcome;
  state: GameState;
}

const chickenProductionModule = createLivestockProductionModule<ChickenProduction>({
  buildingId: "chicken",
  stateKey: "chickenProductions",
  readyAtKey: "eggReadyAt",
  inventoryKey: "eggs",
  intervalMs: CHICKEN_EGG_INTERVAL_MS,
  amount: CHICKEN_EGG_AMOUNT,
});

export function isChickenEggReady(production: ChickenProduction, now: number): boolean {
  return chickenProductionModule.isReady(production, now);
}

export function registerChickenProduction(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): GameState {
  return chickenProductionModule.register(state, buildingInstanceId, now);
}

export function removeChickenProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return chickenProductionModule.remove(state, buildingInstanceId);
}

export function collectChickenEggs(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): ChickenEggResult {
  return chickenProductionModule.collect(state, buildingInstanceId, now);
}

export function normalizeChickenProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): ChickenProduction[] {
  return chickenProductionModule.normalize(value, buildings, now);
}
