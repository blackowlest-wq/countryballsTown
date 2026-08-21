import {
  CHICKEN_EGG_AMOUNT,
  CHICKEN_EGG_INTERVAL_MS,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { ChickenProduction } from "../types/Chicken";
import type { GameState } from "../types/Village";

export type ChickenEggOutcome = "collected" | "not-ready" | "not-found";

export interface ChickenEggResult {
  outcome: ChickenEggOutcome;
  state: GameState;
}

export function isChickenEggReady(production: ChickenProduction, now: number): boolean {
  return now >= production.eggReadyAt;
}

export function registerChickenProduction(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): GameState {
  if (state.chickenProductions.some(
    (chicken) => chicken.buildingInstanceId === buildingInstanceId,
  )) {
    return state;
  }
  return {
    ...state,
    chickenProductions: [
      ...state.chickenProductions,
      { buildingInstanceId, eggReadyAt: now + CHICKEN_EGG_INTERVAL_MS },
    ],
  };
}

export function removeChickenProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  const chickenProductions = state.chickenProductions.filter(
    (chicken) => chicken.buildingInstanceId !== buildingInstanceId,
  );
  return chickenProductions.length === state.chickenProductions.length
    ? state
    : { ...state, chickenProductions };
}

export function collectChickenEggs(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): ChickenEggResult {
  const chicken = state.chickenProductions.find(
    (production) => production.buildingInstanceId === buildingInstanceId,
  );
  if (!chicken) return { outcome: "not-found", state };
  if (!isChickenEggReady(chicken, now)) return { outcome: "not-ready", state };

  return {
    outcome: "collected",
    state: {
      ...state,
      eggs: state.eggs + CHICKEN_EGG_AMOUNT,
      chickenProductions: state.chickenProductions.map((production) =>
        production === chicken
          ? { ...production, eggReadyAt: now + CHICKEN_EGG_INTERVAL_MS }
          : production
      ),
    },
  };
}

export function normalizeChickenProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): ChickenProduction[] {
  const chickenBuildingIds = buildings
    .filter((building) => building.buildingId === "chicken")
    .map((building) => building.id);
  const chickenBuildingIdSet = new Set(chickenBuildingIds);
  const productionsByBuildingId = new Map<string, ChickenProduction>();
  const source = Array.isArray(value) ? value : [];

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<ChickenProduction>;
    if (
      typeof candidate.buildingInstanceId !== "string" ||
      !chickenBuildingIdSet.has(candidate.buildingInstanceId) ||
      typeof candidate.eggReadyAt !== "number" ||
      !Number.isFinite(candidate.eggReadyAt) ||
      productionsByBuildingId.has(candidate.buildingInstanceId)
    ) {
      continue;
    }
    productionsByBuildingId.set(
      candidate.buildingInstanceId,
      candidate as ChickenProduction,
    );
  }

  const normalized = chickenBuildingIds.map(
    (buildingInstanceId) => productionsByBuildingId.get(buildingInstanceId) ?? {
      buildingInstanceId,
      eggReadyAt: now + CHICKEN_EGG_INTERVAL_MS,
    },
  );
  const canReuseSource =
    Array.isArray(value) &&
    source.length === normalized.length &&
    normalized.every((production, index) => production === source[index]);
  return canReuseSource ? source as ChickenProduction[] : normalized;
}
