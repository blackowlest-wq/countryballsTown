import {
  encyclopediaEntries,
  getBuildingEncyclopediaId,
  getCropEncyclopediaId,
  getFishEncyclopediaId,
} from "../data/encyclopedia";
import { fishDefinitions } from "../data/fish";
import { miningResourceDefinitions } from "../data/mining";
import { inventoryPresentationDefinitions } from "../data/inventory";
import type { GameState } from "../types/Village";
import { cropDefinitions } from "../types/Crop";
import type { InventoryItemId } from "../types/Inventory";
import { getInventoryCount } from "./InventorySystem";

const encyclopediaEntryIds = new Set(encyclopediaEntries.map((entry) => entry.id));

const positiveInventoryEntries: ReadonlyArray<readonly [InventoryItemId, string]> = [
  ...Object.values(cropDefinitions).map((crop) => [
    crop.harvestKey,
    getCropEncyclopediaId(crop.type),
  ] as const),
  ...inventoryPresentationDefinitions.map((definition) => [
    definition.countKey,
    definition.id,
  ] as const),
  ...fishDefinitions.map((fish) => [fish.type, getFishEncyclopediaId(fish.type)] as const),
];

const miningInventoryEntries = miningResourceDefinitions.map((resource) => [
  resource.type,
  `mining:${resource.type}`,
] as const);

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
  for (const [itemId, entryId] of positiveInventoryEntries) {
    if (getInventoryCount(state, itemId) > 0) collected.add(entryId);
  }
  for (const [resourceType, entryId] of miningInventoryEntries) {
    if (state.miningInventory[resourceType] > 0) collected.add(entryId);
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
