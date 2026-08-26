export type CropType = "wheat" | "tomato" | "rice";

export type CropSeedKey = "wheatSeeds" | "tomatoSeeds" | "riceSeeds";
export type CropHarvestKey = "wheat" | "tomato" | "rice";

export interface CropDefinition {
  type: CropType;
  name: string;
  icon: string;
  seedKey: CropSeedKey;
  harvestKey: CropHarvestKey;
  seedColor: string;
}

export const cropDefinitions: Record<CropType, CropDefinition> = {
  wheat: {
    type: "wheat",
    name: "小麦",
    icon: "🌾",
    seedKey: "wheatSeeds",
    harvestKey: "wheat",
    seedColor: "#d7bd72",
  },
  tomato: {
    type: "tomato",
    name: "トマト",
    icon: "🍅",
    seedKey: "tomatoSeeds",
    harvestKey: "tomato",
    seedColor: "#b9915f",
  },
  rice: {
    type: "rice",
    name: "米",
    icon: "🍚",
    seedKey: "riceSeeds",
    harvestKey: "rice",
    seedColor: "#9fbd83",
  },
};

export function getCropDefinition(cropType: CropType): CropDefinition {
  return cropDefinitions[cropType];
}

export interface Crop {
  type: CropType;
  gridX: number;
  gridY: number;
  plantedAt: number;
}
