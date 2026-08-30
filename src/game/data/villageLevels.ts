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
    unlockBuildings: [
      "field",
      "warehouse",
      "fence",
      "road",
      "ore-workshop",
      "milk-factory",
      "pork-factory",
      "wheat-factory",
      "bakery",
      "cow",
      "pig",
      "chicken",
      "tree",
      "flower",
    ],
  },
  {
    level: 2,
    requirements: [
      { type: "building-count", targetIds: ["tree", "cherry-tree"], minimum: 3 },
      { type: "building-count", targetIds: ["flower"], minimum: 3 },
    ],
    unlockCountries: ["japan"],
    unlockBuildings: ["onsen", "torii", "cherry-tree", "rice-shop", "fish-shop"],
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
  {
    level: 4,
    requirements: [
      { type: "resident-count", minimum: 3 },
      { type: "building-count", targetIds: ["pizza-shop"], minimum: 1 },
    ],
    unlockCountries: ["china"],
    unlockBuildings: ["chinese-restaurant", "great-wall"],
  },
  {
    level: 5,
    requirements: [
      { type: "resident-count", minimum: 4 },
      { type: "building-count", targetIds: ["chinese-restaurant"], minimum: 1 },
    ],
    unlockCountries: ["usa"],
    unlockBuildings: ["burger-shop", "statue-of-liberty"],
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
