import {
  PIG_PORK_AMOUNT,
  PIG_PORK_INTERVAL_MS,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { PigProduction } from "../types/Pig";
import type { GameState } from "../types/Village";

export type PigPorkOutcome = "collected" | "not-ready" | "not-found";

export interface PigPorkResult {
  outcome: PigPorkOutcome;
  state: GameState;
}

export function isPigPorkReady(production: PigProduction, now: number): boolean {
  return now >= production.porkReadyAt;
}

export function registerPigProduction(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): GameState {
  if (state.pigProductions.some(
    (pig) => pig.buildingInstanceId === buildingInstanceId,
  )) {
    return state;
  }
  return {
    ...state,
    pigProductions: [
      ...state.pigProductions,
      { buildingInstanceId, porkReadyAt: now + PIG_PORK_INTERVAL_MS },
    ],
  };
}

export function removePigProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  const pigProductions = state.pigProductions.filter(
    (pig) => pig.buildingInstanceId !== buildingInstanceId,
  );
  return pigProductions.length === state.pigProductions.length
    ? state
    : { ...state, pigProductions };
}

export function collectPigPork(
  state: GameState,
  buildingInstanceId: string,
  now: number,
): PigPorkResult {
  const pig = state.pigProductions.find(
    (production) => production.buildingInstanceId === buildingInstanceId,
  );
  if (!pig) return { outcome: "not-found", state };
  if (!isPigPorkReady(pig, now)) return { outcome: "not-ready", state };

  return {
    outcome: "collected",
    state: {
      ...state,
      pork: state.pork + PIG_PORK_AMOUNT,
      pigProductions: state.pigProductions.map((production) =>
        production === pig
          ? { ...production, porkReadyAt: now + PIG_PORK_INTERVAL_MS }
          : production
      ),
    },
  };
}

export function normalizePigProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): PigProduction[] {
  const pigBuildingIds = buildings
    .filter((building) => building.buildingId === "pig")
    .map((building) => building.id);
  const pigBuildingIdSet = new Set(pigBuildingIds);
  const productionsByBuildingId = new Map<string, PigProduction>();
  const source = Array.isArray(value) ? value : [];

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<PigProduction>;
    if (
      typeof candidate.buildingInstanceId !== "string" ||
      !pigBuildingIdSet.has(candidate.buildingInstanceId) ||
      typeof candidate.porkReadyAt !== "number" ||
      !Number.isFinite(candidate.porkReadyAt) ||
      productionsByBuildingId.has(candidate.buildingInstanceId)
    ) {
      continue;
    }
    productionsByBuildingId.set(
      candidate.buildingInstanceId,
      candidate as PigProduction,
    );
  }

  const normalized = pigBuildingIds.map(
    (buildingInstanceId) => productionsByBuildingId.get(buildingInstanceId) ?? {
      buildingInstanceId,
      porkReadyAt: now + PIG_PORK_INTERVAL_MS,
    },
  );
  const canReuseSource =
    Array.isArray(value) &&
    source.length === normalized.length &&
    normalized.every((production, index) => production === source[index]);
  return canReuseSource ? source as PigProduction[] : normalized;
}
