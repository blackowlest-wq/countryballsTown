export type MiningResourceType =
  | "copper"
  | "iron"
  | "gold"
  | "diamond"
  | "fossil"
  | "crystal"
  | "amber"
  | "ancient-relic"
  | "glowing-mushroom";

export type MiningResourceCategory = "mineral" | "fossil" | "artifact" | "cave-life";

export type MiningInventory = Record<MiningResourceType, number>;

export interface CavePosition {
  x: number;
  depth: number;
}

export interface CaveMiningState {
  fuel: number;
  fuelTankLevel: number;
  drillLevel: number;
  miningCapacityLevel: number;
  position: CavePosition;
  excavatedCells: string[];
}

export type DigDirection = "left" | "right" | "down";
