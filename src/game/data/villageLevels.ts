export type VillageRequirementType = "building-count" | "resident-count";

export interface VillageRequirement {
  type: VillageRequirementType;
  targetId?: string;
  minimum: number;
}

export interface VillageLevelDefinition {
  level: number;
  requirements: VillageRequirement[];
  unlockCountries: string[];
  unlockBuildings: string[];
}

export const villageLevels: VillageLevelDefinition[] = [
  {
    level: 1,
    requirements: [],
    unlockCountries: ["poland"],
    unlockBuildings: ["tree", "flower"],
  },
  {
    level: 2,
    requirements: [
      { type: "building-count", targetId: "tree", minimum: 3 },
      { type: "building-count", targetId: "flower", minimum: 3 },
    ],
    unlockCountries: ["japan"],
    unlockBuildings: ["onsen", "torii"],
  },
  {
    level: 3,
    requirements: [
      { type: "resident-count", minimum: 2 },
      { type: "building-count", targetId: "onsen", minimum: 1 },
    ],
    unlockCountries: ["italy"],
    unlockBuildings: ["pizza-shop"],
  },
];
