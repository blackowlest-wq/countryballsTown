import type { FishDefinition } from "../systems/FishGameSystem";
import type { FishInventory, FishType } from "../types/Fish";

export const fishDefinitions: readonly FishDefinition[] = [
  {
    type: "sardine",
    name: "イワシ",
    icon: "🐟",
    rarity: "common",
    rarityLabel: "ふつう",
    probability: 0.52,
    biteWindowMs: 3_000,
    gaugeSpeed: 0.42,
    gaugeTargetWidth: 0.3,
    description: "海辺でよく釣れる小さな魚。",
  },
  {
    type: "mackerel",
    name: "サバ",
    icon: "🐠",
    rarity: "uncommon",
    rarityLabel: "めずらしい",
    probability: 0.3,
    biteWindowMs: 2_200,
    gaugeSpeed: 0.68,
    gaugeTargetWidth: 0.23,
    description: "銀色の体がきらめく魚。",
  },
  {
    type: "sea-bream",
    name: "タイ",
    icon: "🐡",
    rarity: "rare",
    rarityLabel: "レア",
    probability: 0.14,
    biteWindowMs: 1_500,
    gaugeSpeed: 0.98,
    gaugeTargetWidth: 0.16,
    description: "赤い体をした縁起のよい魚。",
  },
  {
    type: "tuna",
    name: "マグロ",
    icon: "🐟",
    rarity: "legendary",
    rarityLabel: "伝説",
    probability: 0.04,
    biteWindowMs: 900,
    gaugeSpeed: 1.34,
    gaugeTargetWidth: 0.1,
    description: "大きくて、とてもすばやい魚。",
  },
];

export const fishDefinitionsByType: Readonly<Record<FishType, FishDefinition>> =
  Object.fromEntries(fishDefinitions.map((fish) => [fish.type, fish])) as Record<FishType, FishDefinition>;

export function createInitialFishInventory(): FishInventory {
  return {
    sardine: 0,
    mackerel: 0,
    "sea-bream": 0,
    tuna: 0,
  };
}

export function normalizeFishInventory(value: unknown): FishInventory {
  if (value && typeof value === "object") {
    const candidate = value as Partial<Record<FishType, unknown>>;
    if (
      isValidFishCount(candidate.sardine) &&
      isValidFishCount(candidate.mackerel) &&
      isValidFishCount(candidate["sea-bream"]) &&
      isValidFishCount(candidate.tuna)
    ) {
      return value as FishInventory;
    }
  }

  const candidate = value && typeof value === "object"
    ? value as Partial<Record<FishType, unknown>>
    : {};
  return {
    sardine: normalizeFishCount(candidate.sardine),
    mackerel: normalizeFishCount(candidate.mackerel),
    "sea-bream": normalizeFishCount(candidate["sea-bream"]),
    tuna: normalizeFishCount(candidate.tuna),
  };
}

function isValidFishCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

function normalizeFishCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
