export type FishType = "sardine" | "mackerel" | "sea-bream" | "tuna";

export type FishRarity = "common" | "uncommon" | "rare" | "legendary";

export type FishInventory = Record<FishType, number>;
