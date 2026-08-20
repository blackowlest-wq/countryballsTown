import {
  COW_MILK_AMOUNT,
  COW_MILK_INTERVAL_MS,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { CowProduction } from "../types/Cow";
import type { GameState } from "../types/Village";

export type CowMilkOutcome = "collected" | "not-ready" | "not-found";

export interface CowMilkResult {
  outcome: CowMilkOutcome;
  state: GameState;
}

export function isCowMilkReady(production: CowProduction, now: number): boolean {
  return now >= production.milkReadyAt;
}

export function registerCowProduction(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): GameState {
  if (state.cowProductions.some((cow) => cow.buildingInstanceId === buildingInstanceId)) {
    return state;
  }
  return {
    ...state,
    cowProductions: [
      ...state.cowProductions,
      { buildingInstanceId, milkReadyAt: now + COW_MILK_INTERVAL_MS },
    ],
  };
}

export function removeCowProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  const cowProductions = state.cowProductions.filter(
    (cow) => cow.buildingInstanceId !== buildingInstanceId,
  );
  return cowProductions.length === state.cowProductions.length
    ? state
    : { ...state, cowProductions };
}

export function collectCowMilk(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): CowMilkResult {
  const cow = state.cowProductions.find(
    (production) => production.buildingInstanceId === buildingInstanceId,
  );
  if (!cow) return { outcome: "not-found", state };
  if (!isCowMilkReady(cow, now)) return { outcome: "not-ready", state };

  return {
    outcome: "collected",
    state: {
      ...state,
      milk: state.milk + COW_MILK_AMOUNT,
      cowProductions: state.cowProductions.map((production) =>
        production === cow
          ? { ...production, milkReadyAt: now + COW_MILK_INTERVAL_MS }
          : production
      ),
    },
  };
}

export function normalizeCowProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): CowProduction[] {
  const cowBuildingIds = buildings
    .filter((building) => building.buildingId === "cow")
    .map((building) => building.id);
  const cowBuildingIdSet = new Set(cowBuildingIds);
  const productionsByBuildingId = new Map<string, CowProduction>();
  const source = Array.isArray(value) ? value : [];

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<CowProduction>;
    if (
      typeof candidate.buildingInstanceId !== "string" ||
      !cowBuildingIdSet.has(candidate.buildingInstanceId) ||
      typeof candidate.milkReadyAt !== "number" ||
      !Number.isFinite(candidate.milkReadyAt) ||
      productionsByBuildingId.has(candidate.buildingInstanceId)
    ) {
      continue;
    }
    productionsByBuildingId.set(
      candidate.buildingInstanceId,
      candidate as CowProduction,
    );
  }

  const normalized = cowBuildingIds.map(
    (buildingInstanceId) => productionsByBuildingId.get(buildingInstanceId) ?? {
      buildingInstanceId,
      milkReadyAt: now + COW_MILK_INTERVAL_MS,
    },
  );
  const canReuseSource =
    Array.isArray(value) &&
    source.length === normalized.length &&
    normalized.every((production, index) => production === source[index]);
  return canReuseSource ? source as CowProduction[] : normalized;
}
