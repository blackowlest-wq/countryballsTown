import { createInitialResident } from "../systems/ResidentSystem";
import {
  INITIAL_TOMATO_SEEDS,
  INITIAL_WHEAT_SEEDS,
  INITIAL_RICE_SEEDS,
  RESIDENT_REQUEST_INITIAL_DELAY_MS,
} from "../constants/gameConstants";
import type { GameState } from "../types/Village";
import { getLocalDateKey } from "../../utils/date";
import { createInitialMiningInventory } from "../data/mining";
import {
  CAVE_DEFAULT_LAYOUT_SEED,
  createCaveLayoutSeed,
  createInitialCaveMiningState,
} from "../systems/CaveMiningSystem";
import { syncEncyclopediaCollection } from "../systems/EncyclopediaSystem";
import { createInitialInventory } from "../systems/InventorySystem";
import { ensureMarketOrders } from "../systems/MarketOrderSystem";
import { createInitialBuildingUpgrades } from "../systems/BuildingUpgradeSystem";

export function createInitialGameState(now = Date.now()): GameState {
  const initialState: GameState = syncEncyclopediaCollection({
    coins: 100,
    wheatSeeds: INITIAL_WHEAT_SEEDS,
    tomatoSeeds: INITIAL_TOMATO_SEEDS,
    riceSeeds: INITIAL_RICE_SEEDS,
    crops: [],
    inventory: createInitialInventory(),
    miningInventory: createInitialMiningInventory(),
    caveMining: createInitialCaveMiningState(
      now === 0 ? CAVE_DEFAULT_LAYOUT_SEED : createCaveLayoutSeed(),
    ),
    hasFishingRod: false,
    currentMap: "village",
    cowProductions: [],
    pigProductions: [],
    chickenProductions: [],
    milkFactoryProductions: [],
    porkFactoryProductions: [],
    wheatFactoryProductions: [],
    villageLevel: 1,
    residents: [createInitialResident("poland", { x: 6.5, z: 5.5 })],
    buildings: [
      { id: "house-1", buildingId: "house", gridX: 5, gridY: 5 },
      { id: "fountain-1", buildingId: "fountain", gridX: 9, gridY: 9 },
      { id: "tree-1", buildingId: "tree", gridX: 3, gridY: 3 },
      { id: "tree-2", buildingId: "tree", gridX: 16, gridY: 4 },
    ],
    buildingUpgrades: createInitialBuildingUpgrades(),
    encyclopediaCollectedIds: [],
    unlockedCountries: ["poland"],
    unlockedBuildings: [
      "field",
      "warehouse",
      "fence",
      "road",
      "ore-workshop",
      "milk-factory",
      "pork-factory",
      "wheat-factory",
      "bakery",
      "cow",
      "pig",
      "chicken",
      "tree",
      "flower",
    ],
    activeResidentRequest: null,
    nextResidentRequestAt: now + RESIDENT_REQUEST_INITIAL_DELAY_MS,
    residentRequestDayKey: getLocalDateKey(now),
    residentRequestsStartedToday: 0,
    marketOrders: [],
    marketOrderSequence: 0,
    lastSavedAt: now,
  });
  return ensureMarketOrders(initialState);
}
