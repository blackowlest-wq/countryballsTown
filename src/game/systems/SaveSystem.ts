import {
  INITIAL_TOMATO_SEEDS,
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
import { normalizeCowProductions } from "./CowSystem";
import { isCellInField, normalizeCrops } from "./CropSystem";
import { normalizeMilkFactoryProductions } from "./MilkFactorySystem";
import { normalizePigProductions } from "./PigSystem";
import { normalizePorkFactoryProductions } from "./PorkFactorySystem";

interface LegacyCropState {
  wheatCrops?: unknown;
}

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
    const now = Date.now();
    const buildings = createBuildingCollection(state.buildings).buildings;
    const crops = normalizeCrops(state.crops);
    const cowProductions = normalizeCowProductions(state.cowProductions, buildings, now);
    const milkFactoryProductions = normalizeMilkFactoryProductions(
      state.milkFactoryProductions,
      buildings,
      now,
    );
    const pigProductions = normalizePigProductions(state.pigProductions, buildings, now);
    const porkFactoryProductions = normalizePorkFactoryProductions(
      state.porkFactoryProductions,
      buildings,
      now,
    );
    const { wheatCrops: _legacyWheatCrops, ...stateWithoutLegacyCrops } = (
      state as GameState & LegacyCropState
    );
    storage.setItem(SAVE_KEY, JSON.stringify({
      ...stateWithoutLegacyCrops,
      buildings,
      crops,
      cowProductions,
      milkFactoryProductions,
      pigProductions,
      porkFactoryProductions,
      lastSavedAt: now,
    }));
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
    const legacyParsed = parsed as GameState & LegacyCropState;
    const hasCurrentCrops = Array.isArray(parsed.crops);
    const normalizedCrops = normalizeCrops(
      hasCurrentCrops ? parsed.crops : legacyParsed.wheatCrops,
      hasCurrentCrops ? undefined : "wheat",
    );
    const crops = normalizedCrops.filter((crop) =>
      isCellInField(buildings, crop.gridX, crop.gridY)
    );
    const discardedCrops = normalizedCrops.filter((crop) => !crops.includes(crop));
    const refundedWheatSeeds = discardedCrops.filter((crop) => crop.type === "wheat").length;
    const refundedTomatoSeeds = discardedCrops.filter((crop) => crop.type === "tomato").length;
    const storedWheatSeeds =
      typeof parsed.wheatSeeds === "number" && Number.isFinite(parsed.wheatSeeds)
        ? Math.max(0, Math.floor(parsed.wheatSeeds))
        : INITIAL_WHEAT_SEEDS;
    const storedTomatoSeeds =
      typeof parsed.tomatoSeeds === "number" && Number.isFinite(parsed.tomatoSeeds)
        ? Math.max(0, Math.floor(parsed.tomatoSeeds))
        : INITIAL_TOMATO_SEEDS;
    const { wheatCrops: _legacyWheatCrops, ...stateWithoutLegacyCrops } = legacyParsed;
    return {
      ...stateWithoutLegacyCrops,
      wheatSeeds: storedWheatSeeds + refundedWheatSeeds,
      wheat:
        typeof parsed.wheat === "number" && Number.isFinite(parsed.wheat)
          ? Math.max(0, Math.floor(parsed.wheat))
          : 0,
      tomatoSeeds: storedTomatoSeeds + refundedTomatoSeeds,
      tomatoes:
        typeof parsed.tomatoes === "number" && Number.isFinite(parsed.tomatoes)
          ? Math.max(0, Math.floor(parsed.tomatoes))
          : 0,
      crops,
      milk:
        typeof parsed.milk === "number" && Number.isFinite(parsed.milk)
          ? Math.max(0, Math.floor(parsed.milk))
          : 0,
      pork:
        typeof parsed.pork === "number" && Number.isFinite(parsed.pork)
          ? Math.max(0, Math.floor(parsed.pork))
          : 0,
      butter:
        typeof parsed.butter === "number" && Number.isFinite(parsed.butter)
          ? Math.max(0, Math.floor(parsed.butter))
          : 0,
      cheese:
        typeof parsed.cheese === "number" && Number.isFinite(parsed.cheese)
          ? Math.max(0, Math.floor(parsed.cheese))
          : 0,
      ham:
        typeof parsed.ham === "number" && Number.isFinite(parsed.ham)
          ? Math.max(0, Math.floor(parsed.ham))
          : 0,
      sausage:
        typeof parsed.sausage === "number" && Number.isFinite(parsed.sausage)
          ? Math.max(0, Math.floor(parsed.sausage))
          : 0,
      bacon:
        typeof parsed.bacon === "number" && Number.isFinite(parsed.bacon)
          ? Math.max(0, Math.floor(parsed.bacon))
          : 0,
      cowProductions: normalizeCowProductions(parsed.cowProductions, buildings, now),
      milkFactoryProductions: normalizeMilkFactoryProductions(
        parsed.milkFactoryProductions,
        buildings,
        now,
      ),
      pigProductions: normalizePigProductions(parsed.pigProductions, buildings, now),
      porkFactoryProductions: normalizePorkFactoryProductions(
        parsed.porkFactoryProductions,
        buildings,
        now,
      ),
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
