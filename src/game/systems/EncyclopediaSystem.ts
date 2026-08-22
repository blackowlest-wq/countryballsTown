import {
  encyclopediaEntries,
  getBuildingEncyclopediaId,
  getCropEncyclopediaId,
  getFishEncyclopediaId,
  getFoodEncyclopediaId,
  getLivestockEncyclopediaId,
  getProcessedEncyclopediaId,
} from "../data/encyclopedia";
import { fishDefinitions } from "../data/fish";
import type { FishType } from "../types/Fish";
import type { GameState } from "../types/Village";

const encyclopediaEntryIds = new Set(encyclopediaEntries.map((entry) => entry.id));

const positiveInventoryEntries: ReadonlyArray<[keyof GameState, string]> = [
  ["wheat", getCropEncyclopediaId("wheat")],
  ["tomatoes", getCropEncyclopediaId("tomato")],
  ["rice", getCropEncyclopediaId("rice")],
  ["milk", getLivestockEncyclopediaId("milk")],
  ["pork", getLivestockEncyclopediaId("pork")],
  ["eggs", getLivestockEncyclopediaId("eggs")],
  ["wheatFlour", getProcessedEncyclopediaId("wheat-flour")],
  ["butter", getProcessedEncyclopediaId("butter")],
  ["cheese", getProcessedEncyclopediaId("cheese")],
  ["ham", getProcessedEncyclopediaId("ham")],
  ["sausage", getProcessedEncyclopediaId("sausage")],
  ["bacon", getProcessedEncyclopediaId("bacon")],
  ["pizzas", getFoodEncyclopediaId("pizza")],
  ["bread", getFoodEncyclopediaId("bread")],
  ["hotDogs", getFoodEncyclopediaId("hot-dog")],
  ["croissants", getFoodEncyclopediaId("croissant")],
  ["hamSandwiches", getFoodEncyclopediaId("ham-sandwich")],
  ["onigiri", getFoodEncyclopediaId("onigiri")],
  ["omurice", getFoodEncyclopediaId("omurice")],
];

const fishInventoryEntries: ReadonlyArray<readonly [FishType, string]> =
  fishDefinitions.map((fish) => [fish.type, getFishEncyclopediaId(fish.type)] as const);

export function normalizeEncyclopediaCollectedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || !encyclopediaEntryIds.has(item)) continue;
    seen.add(item);
  }
  return encyclopediaEntries
    .map((entry) => entry.id)
    .filter((entryId) => seen.has(entryId));
}

export function syncEncyclopediaCollection(state: GameState): GameState {
  const originalCollectedIds = normalizeEncyclopediaCollectedIds(state.encyclopediaCollectedIds);
  const collected = new Set(originalCollectedIds);

  for (const building of state.buildings) {
    const entryId = getBuildingEncyclopediaId(building.buildingId);
    if (encyclopediaEntryIds.has(entryId)) collected.add(entryId);
  }
  for (const crop of state.crops) collected.add(getCropEncyclopediaId(crop.type));
  for (const [key, entryId] of positiveInventoryEntries) {
    const value = state[key];
    if (typeof value === "number" && value > 0) collected.add(entryId);
  }
  for (const [fishType, entryId] of fishInventoryEntries) {
    if (state.fishInventory[fishType] > 0) collected.add(entryId);
  }

  const encyclopediaCollectedIds = encyclopediaEntries
    .map((entry) => entry.id)
    .filter((entryId) => collected.has(entryId));
  if (
    encyclopediaCollectedIds.length === originalCollectedIds.length &&
    encyclopediaCollectedIds.every((entryId, index) => entryId === originalCollectedIds[index])
  ) {
    return state;
  }
  return { ...state, encyclopediaCollectedIds };
}
