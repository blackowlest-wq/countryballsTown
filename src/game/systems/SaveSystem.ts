import {
  INITIAL_WHEAT_SEEDS,
  RESIDENT_REQUEST_DAILY_LIMIT,
  RESIDENT_REQUEST_INITIAL_DELAY_MS,
  SAVE_KEY,
} from "../constants/gameConstants";
import { createBuildingCollection } from "../core/BuildingCollection";
import { createInitialGameState } from "../core/GameState";
import { getUnlockedBuildingIdsForLevel } from "../data/villageLevels";
import type { ActiveResidentRequest } from "../types/ResidentRequest";
import type { GameState } from "../types/Village";
import { getLocalDateKey } from "../../utils/date";
import { isCellInField, normalizeWheatCrops } from "./WheatSystem";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameState>;
  return (
    typeof candidate.coins === "number" &&
    typeof candidate.villageLevel === "number" &&
    Array.isArray(candidate.residents) &&
    Array.isArray(candidate.buildings) &&
    Array.isArray(candidate.unlockedCountries) &&
    Array.isArray(candidate.unlockedBuildings)
  );
}

function isActiveResidentRequest(value: unknown): value is ActiveResidentRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ActiveResidentRequest>;
  return (
    typeof candidate.definitionId === "string" &&
    typeof candidate.residentId === "string" &&
    typeof candidate.progress === "number" &&
    typeof candidate.startedAt === "number"
  );
}

function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined" || !window.localStorage) return undefined;
  return window.localStorage;
}

export function saveGameState(
  state: GameState,
  storage: StorageLike | undefined = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    const buildings = createBuildingCollection(state.buildings).buildings;
    storage.setItem(SAVE_KEY, JSON.stringify({ ...state, buildings, lastSavedAt: Date.now() }));
  } catch {
    // Saving is best-effort: a private browsing quota error should not stop the game.
  }
}

export function loadGameState(
  storage: StorageLike | undefined = getBrowserStorage(),
  now = Date.now(),
): GameState {
  if (!storage) return createInitialGameState(now);
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState(now);
    const parsed: unknown = JSON.parse(raw);
    if (!isGameState(parsed)) return createInitialGameState(now);
    const activeResidentRequest = isActiveResidentRequest(parsed.activeResidentRequest)
      ? parsed.activeResidentRequest
      : null;
    const residentRequestDayKey = getLocalDateKey(now);
    const hasCurrentStoredQuota =
      parsed.residentRequestDayKey === residentRequestDayKey &&
      Number.isInteger(parsed.residentRequestsStartedToday) &&
      parsed.residentRequestsStartedToday >= 0;
    const migratedActiveRequestCount =
      typeof parsed.residentRequestDayKey !== "string" &&
      activeResidentRequest &&
      getLocalDateKey(activeResidentRequest.startedAt) === residentRequestDayKey
        ? 1
        : 0;
    const buildings = createBuildingCollection(parsed.buildings).buildings;
    const normalizedWheatCrops = normalizeWheatCrops(parsed.wheatCrops);
    const wheatCrops = normalizedWheatCrops.filter((crop) =>
      isCellInField(buildings, crop.gridX, crop.gridY)
    );
    const refundedSeeds = normalizedWheatCrops.length - wheatCrops.length;
    const storedWheatSeeds =
      typeof parsed.wheatSeeds === "number" && Number.isFinite(parsed.wheatSeeds)
        ? Math.max(0, Math.floor(parsed.wheatSeeds))
        : INITIAL_WHEAT_SEEDS;
    return {
      ...parsed,
      wheatSeeds: storedWheatSeeds + refundedSeeds,
      wheat:
        typeof parsed.wheat === "number" && Number.isFinite(parsed.wheat)
          ? Math.max(0, Math.floor(parsed.wheat))
          : 0,
      wheatCrops,
      buildings,
      unlockedBuildings: [
        ...new Set([
          ...parsed.unlockedBuildings,
          ...getUnlockedBuildingIdsForLevel(parsed.villageLevel),
        ]),
      ],
      activeResidentRequest,
      nextResidentRequestAt:
        typeof parsed.nextResidentRequestAt === "number"
          ? parsed.nextResidentRequestAt
          : now + RESIDENT_REQUEST_INITIAL_DELAY_MS,
      lastResidentRequestDefinitionId:
        typeof parsed.lastResidentRequestDefinitionId === "string"
          ? parsed.lastResidentRequestDefinitionId
          : undefined,
      residentRequestDayKey,
      residentRequestsStartedToday: hasCurrentStoredQuota
        ? Math.min(parsed.residentRequestsStartedToday, RESIDENT_REQUEST_DAILY_LIMIT)
        : migratedActiveRequestCount,
      lastSavedAt: parsed.lastSavedAt || now,
    };
  } catch {
    return createInitialGameState(now);
  }
}
