export type VillageRequirementType = "building-count" | "resident-count";

export interface VillageRequirement {
  type: VillageRequirementType;
  targetIds?: string[];
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
    unlockBuildings: ["field", "tree", "flower"],
  },
  {
    level: 2,
    requirements: [
      { type: "building-count", targetIds: ["tree", "cherry-tree"], minimum: 3 },
      { type: "building-count", targetIds: ["flower"], minimum: 3 },
    ],
    unlockCountries: ["japan"],
    unlockBuildings: ["onsen", "torii", "cherry-tree"],
  },
  {
    level: 3,
    requirements: [
      { type: "resident-count", minimum: 2 },
      { type: "building-count", targetIds: ["onsen"], minimum: 1 },
    ],
    unlockCountries: ["italy"],
    unlockBuildings: ["pizza-shop"],
  },
];

export function getUnlockedBuildingIdsForLevel(level: number): string[] {
  return [
    ...new Set(
      villageLevels
        .filter((definition) => definition.level <= level)
        .flatMap((definition) => definition.unlockBuildings),
    ),
  ];
}
