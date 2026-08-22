import {
  INITIAL_TOMATO_SEEDS,
  INITIAL_RICE_SEEDS,
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
import { isCellInField, normalizeCrops } from "./CropSystem";
import { normalizeFishInventory } from "../data/fish";
import { isMapId } from "./MapSystem";
import { syncEncyclopediaCollection } from "./EncyclopediaSystem";
import { normalizeProductionCollections } from "./ProductionRegistry";

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

export function prepareGameStateForSave(
  state: GameState,
  now = Date.now(),
): GameState {
  const buildings = createBuildingCollection(state.buildings).buildings;
  const crops = normalizeCrops(state.crops);
  const productionCollections = normalizeProductionCollections({
    cowProductions: state.cowProductions,
    pigProductions: state.pigProductions,
    chickenProductions: state.chickenProductions,
    milkFactoryProductions: state.milkFactoryProductions,
    porkFactoryProductions: state.porkFactoryProductions,
    wheatFactoryProductions: state.wheatFactoryProductions,
  }, buildings, now);
  const fishInventory = normalizeFishInventory(state.fishInventory);
  const normalizedState = syncEncyclopediaCollection({
    ...state,
    buildings,
    crops,
    fishInventory,
  });
  const { wheatCrops: _legacyWheatCrops, ...stateWithoutLegacyCrops } = (
    normalizedState as GameState & LegacyCropState
  );
  return {
    ...stateWithoutLegacyCrops,
    buildings,
    crops,
    ...productionCollections,
    fishInventory,
    encyclopediaCollectedIds: normalizedState.encyclopediaCollectedIds,
    lastSavedAt: now,
  };
}

export function saveGameState(
  state: GameState,
  storage: StorageLike | undefined = getBrowserStorage(),
  now = Date.now(),
): GameState {
  let saved: GameState;
  try {
    saved = prepareGameStateForSave(state, now);
  } catch {
    // Saving is best-effort: an unexpected malformed state should not stop the game.
    return state;
  }
  if (!storage) return saved;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(saved));
  } catch {
    // Saving is best-effort: a private browsing quota error should not stop the game.
  }
  return saved;
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
    const refundedRiceSeeds = discardedCrops.filter((crop) => crop.type === "rice").length;
    const storedWheatSeeds =
      typeof parsed.wheatSeeds === "number" && Number.isFinite(parsed.wheatSeeds)
        ? Math.max(0, Math.floor(parsed.wheatSeeds))
        : INITIAL_WHEAT_SEEDS;
    const storedTomatoSeeds =
      typeof parsed.tomatoSeeds === "number" && Number.isFinite(parsed.tomatoSeeds)
        ? Math.max(0, Math.floor(parsed.tomatoSeeds))
        : INITIAL_TOMATO_SEEDS;
    const storedRiceSeeds =
      typeof parsed.riceSeeds === "number" && Number.isFinite(parsed.riceSeeds)
        ? Math.max(0, Math.floor(parsed.riceSeeds))
        : INITIAL_RICE_SEEDS;
    const { wheatCrops: _legacyWheatCrops, ...stateWithoutLegacyCrops } = legacyParsed;
    const loadedState: GameState = {
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
      riceSeeds: storedRiceSeeds + refundedRiceSeeds,
      rice:
        typeof parsed.rice === "number" && Number.isFinite(parsed.rice)
          ? Math.max(0, Math.floor(parsed.rice))
          : 0,
      crops,
      eggs:
        typeof parsed.eggs === "number" && Number.isFinite(parsed.eggs)
          ? Math.max(0, Math.floor(parsed.eggs))
          : 0,
      milk:
        typeof parsed.milk === "number" && Number.isFinite(parsed.milk)
          ? Math.max(0, Math.floor(parsed.milk))
          : 0,
      pork:
        typeof parsed.pork === "number" && Number.isFinite(parsed.pork)
          ? Math.max(0, Math.floor(parsed.pork))
          : 0,
      wheatFlour:
        typeof parsed.wheatFlour === "number" && Number.isFinite(parsed.wheatFlour)
          ? Math.max(0, Math.floor(parsed.wheatFlour))
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
      pizzas:
        typeof parsed.pizzas === "number" && Number.isFinite(parsed.pizzas)
          ? Math.max(0, Math.floor(parsed.pizzas))
          : 0,
      bread:
        typeof parsed.bread === "number" && Number.isFinite(parsed.bread)
          ? Math.max(0, Math.floor(parsed.bread))
          : 0,
      hotDogs:
        typeof parsed.hotDogs === "number" && Number.isFinite(parsed.hotDogs)
          ? Math.max(0, Math.floor(parsed.hotDogs))
          : 0,
      croissants:
        typeof parsed.croissants === "number" && Number.isFinite(parsed.croissants)
          ? Math.max(0, Math.floor(parsed.croissants))
          : 0,
      hamSandwiches:
        typeof parsed.hamSandwiches === "number" && Number.isFinite(parsed.hamSandwiches)
          ? Math.max(0, Math.floor(parsed.hamSandwiches))
          : 0,
      onigiri:
        typeof parsed.onigiri === "number" && Number.isFinite(parsed.onigiri)
          ? Math.max(0, Math.floor(parsed.onigiri))
          : 0,
      omurice:
        typeof parsed.omurice === "number" && Number.isFinite(parsed.omurice)
          ? Math.max(0, Math.floor(parsed.omurice))
          : 0,
      fishInventory: normalizeFishInventory(parsed.fishInventory),
      currentMap: isMapId(parsed.currentMap) ? parsed.currentMap : "village",
      ...normalizeProductionCollections({
        cowProductions: parsed.cowProductions,
        pigProductions: parsed.pigProductions,
        chickenProductions: parsed.chickenProductions,
        milkFactoryProductions: parsed.milkFactoryProductions,
        porkFactoryProductions: parsed.porkFactoryProductions,
        wheatFactoryProductions: parsed.wheatFactoryProductions,
      }, buildings, now),
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
    return syncEncyclopediaCollection(loadedState);
  } catch {
    return createInitialGameState(now);
  }
}
