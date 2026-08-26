import type { FishDefinition } from "../systems/FishGameSystem";
import type { FishType } from "../types/Fish";

const STANDARD_FISH_SIZE = 0.18;

export const fishDefinitions: readonly FishDefinition[] = [
  {
    type: "sardine",
    name: "イワシ",
    icon: "🐟",
    rarity: "common",
    rarityLabel: "ふつう",
    probability: 0.52,
    biteWindowMs: 3_000,
    movementSpeed: 0.32,
    movementChangeIntervalMs: 900,
    fishSize: STANDARD_FISH_SIZE,
    catchFrameSize: 0.28,
    catchDurationMs: 1_800,
    timeLimitMs: 8_000,
    description: "海辺でよく釣れる魚。",
  },
  {
    type: "mackerel",
    name: "サバ",
    icon: "🐟",
    rarity: "uncommon",
    rarityLabel: "めずらしい",
    probability: 0.3,
    biteWindowMs: 2_200,
    movementSpeed: 0.48,
    movementChangeIntervalMs: 760,
    fishSize: STANDARD_FISH_SIZE,
    catchFrameSize: 0.24,
    catchDurationMs: 2_200,
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
    movementSpeed: 0.68,
    movementChangeIntervalMs: 620,
    fishSize: STANDARD_FISH_SIZE,
    catchFrameSize: 0.21,
    catchDurationMs: 2_800,
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
    movementSpeed: 0.92,
    movementChangeIntervalMs: 500,
    fishSize: STANDARD_FISH_SIZE,
    catchFrameSize: 0.18,
    catchDurationMs: 3_600,
    timeLimitMs: 5_000,
    description: "とてもすばやく、釣り上げに時間がかかる魚。",
  },
];

export const fishDefinitionsByType: Readonly<Record<FishType, FishDefinition>> =
  Object.fromEntries(fishDefinitions.map((fish) => [fish.type, fish])) as Record<FishType, FishDefinition>;
