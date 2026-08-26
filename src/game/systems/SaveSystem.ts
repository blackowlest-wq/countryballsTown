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
import { normalizeMiningInventory } from "../data/mining";
import { isMapId } from "./MapSystem";
import { syncEncyclopediaCollection } from "./EncyclopediaSystem";
import { normalizeCaveMiningState } from "./CaveMiningSystem";
import { normalizeProductionCollections } from "./ProductionRegistry";
import { normalizeCoinBalance } from "./EconomySystem";
import {
  isCanonicalInventory,
  normalizeInventory,
} from "./InventorySystem";
import { normalizeMarketOrders } from "./MarketOrderSystem";
import { normalizeBuildingUpgrades } from "./BuildingUpgradeSystem";

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
    isCanonicalInventory(candidate.inventory) &&
    Array.isArray(candidate.residents) &&
    Array.isArray(candidate.buildings) &&
    Array.isArray(candidate.unlockedCountries) &&
    Array.isArray(candidate.unlockedBuildings) &&
    Array.isArray(candidate.marketOrders) &&
    typeof candidate.marketOrderSequence === "number" &&
    candidate.buildingUpgrades !== undefined
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

function normalizeStoredSeed(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
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
  const inventory = normalizeInventory(state.inventory);
  const miningInventory = normalizeMiningInventory(state.miningInventory);
  const caveMining = normalizeCaveMiningState(state.caveMining);
  const marketOrders = normalizeMarketOrders(
    state.marketOrders,
    state.marketOrderSequence,
    state,
  );
  const buildingUpgrades = normalizeBuildingUpgrades(state.buildingUpgrades, buildings);
  const normalizedState = syncEncyclopediaCollection({
    ...state,
    coins: normalizeCoinBalance(state.coins),
    buildings,
    crops,
    inventory,
    miningInventory,
    caveMining,
    ...marketOrders,
    buildingUpgrades,
    hasFishingRod: state.hasFishingRod === true,
  });
  return {
    ...normalizedState,
    coins: normalizedState.coins,
    buildings,
    crops,
    ...productionCollections,
    inventory,
    miningInventory,
    caveMining,
    ...marketOrders,
    buildingUpgrades,
    hasFishingRod: normalizedState.hasFishingRod,
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
    // Old scalar saves intentionally start a fresh game. This keeps the
    // canonical inventory shape unambiguous during the current test phase.
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
    const normalizedCrops = normalizeCrops(parsed.crops);
    const crops = normalizedCrops.filter((crop) =>
      isCellInField(buildings, crop.gridX, crop.gridY)
    );
    const discardedCrops = normalizedCrops.filter((crop) => !crops.includes(crop));
    const refundedWheatSeeds = discardedCrops.filter((crop) => crop.type === "wheat").length;
    const refundedTomatoSeeds = discardedCrops.filter((crop) => crop.type === "tomato").length;
    const refundedRiceSeeds = discardedCrops.filter((crop) => crop.type === "rice").length;
    const storedWheatSeeds = normalizeStoredSeed(parsed.wheatSeeds, INITIAL_WHEAT_SEEDS);
    const storedTomatoSeeds = normalizeStoredSeed(parsed.tomatoSeeds, INITIAL_TOMATO_SEEDS);
    const storedRiceSeeds = normalizeStoredSeed(parsed.riceSeeds, INITIAL_RICE_SEEDS);
    const unlockedBuildings = [
      ...new Set([
        ...parsed.unlockedBuildings,
        ...getUnlockedBuildingIdsForLevel(parsed.villageLevel),
      ]),
    ];
    const marketOrders = normalizeMarketOrders(
      parsed.marketOrders,
      parsed.marketOrderSequence,
      { unlockedBuildings },
    );
    const buildingUpgrades = normalizeBuildingUpgrades(parsed.buildingUpgrades, buildings);
    const loadedState: GameState = {
      ...parsed,
      coins: normalizeCoinBalance(parsed.coins),
      wheatSeeds: storedWheatSeeds + refundedWheatSeeds,
      tomatoSeeds: storedTomatoSeeds + refundedTomatoSeeds,
      riceSeeds: storedRiceSeeds + refundedRiceSeeds,
      crops,
      inventory: normalizeInventory(parsed.inventory),
      miningInventory: normalizeMiningInventory(parsed.miningInventory),
      caveMining: normalizeCaveMiningState(parsed.caveMining),
      buildingUpgrades,
      hasFishingRod: parsed.hasFishingRod === true,
      currentMap: isMapId(parsed.currentMap) ? parsed.currentMap : "village",
      ...marketOrders,
      ...normalizeProductionCollections({
        cowProductions: parsed.cowProductions,
        pigProductions: parsed.pigProductions,
        chickenProductions: parsed.chickenProductions,
        milkFactoryProductions: parsed.milkFactoryProductions,
        porkFactoryProductions: parsed.porkFactoryProductions,
        wheatFactoryProductions: parsed.wheatFactoryProductions,
      }, buildings, now),
      buildings,
      unlockedBuildings,
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
