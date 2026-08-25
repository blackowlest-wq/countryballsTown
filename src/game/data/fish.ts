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
    movementSpeed: 0.16,
    movementChangeIntervalMs: 900,
    fishSize: 0.1,
    catchFrameSize: 0.28,
    catchDurationMs: 1_800,
    timeLimitMs: 8_000,
    description: "海辺でよく釣れる小さな魚。",
  },
  {
    type: "mackerel",
    name: "サバ",
    icon: "🐟",
    rarity: "uncommon",
    rarityLabel: "めずらしい",
    probability: 0.3,
    biteWindowMs: 2_200,
    movementSpeed: 0.22,
    movementChangeIntervalMs: 760,
    fishSize: 0.1,
    catchFrameSize: 0.24,
    catchDurationMs: 1_900,
    timeLimitMs: 7_000,
    description: "銀色の体がきらめく魚。",
  },
  {
    type: "sea-bream",
    name: "タイ",
    icon: "🐟",
    rarity: "rare",
    rarityLabel: "レア",
    probability: 0.14,
    biteWindowMs: 1_500,
    movementSpeed: 0.29,
    movementChangeIntervalMs: 620,
    fishSize: 0.11,
    catchFrameSize: 0.21,
    catchDurationMs: 2_000,
    timeLimitMs: 6_000,
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
    movementSpeed: 0.38,
    movementChangeIntervalMs: 500,
    fishSize: 0.12,
    catchFrameSize: 0.18,
    catchDurationMs: 2_100,
    timeLimitMs: 5_000,
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
