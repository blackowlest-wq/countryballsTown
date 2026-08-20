import { createInitialResident } from "../systems/ResidentSystem";
import {
  INITIAL_TOMATO_SEEDS,
  INITIAL_WHEAT_SEEDS,
  RESIDENT_REQUEST_INITIAL_DELAY_MS,
} from "../constants/gameConstants";
import type { GameState } from "../types/Village";
import { getLocalDateKey } from "../../utils/date";

export function createInitialGameState(now = Date.now()): GameState {
  return {
    coins: 100,
    wheatSeeds: INITIAL_WHEAT_SEEDS,
    wheat: 0,
    tomatoSeeds: INITIAL_TOMATO_SEEDS,
    tomatoes: 0,
    crops: [],
    milk: 0,
    cowProductions: [],
    villageLevel: 1,
    residents: [createInitialResident("poland", { x: 6.5, z: 5.5 })],
    buildings: [
      { id: "house-1", buildingId: "house", gridX: 5, gridY: 5 },
      { id: "fountain-1", buildingId: "fountain", gridX: 9, gridY: 9 },
      { id: "tree-1", buildingId: "tree", gridX: 3, gridY: 3 },
      { id: "tree-2", buildingId: "tree", gridX: 16, gridY: 4 },
    ],
    unlockedCountries: ["poland"],
    unlockedBuildings: ["field", "cow", "tree", "flower"],
    activeResidentRequest: null,
    nextResidentRequestAt: now + RESIDENT_REQUEST_INITIAL_DELAY_MS,
    residentRequestDayKey: getLocalDateKey(now),
    residentRequestsStartedToday: 0,
    lastSavedAt: now,
  };
}
