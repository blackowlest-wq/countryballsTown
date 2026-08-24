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
  /** Items carried during the active mining session; emptied when the game ends. */
  carriedInventory: MiningInventory;
  layoutSeed: number;
  position: CavePosition;
  excavatedCells: string[];
  /** Damage is stored sparsely: untouched and fully excavated cells are absent. */
  cellDamage: Record<string, number>;
}

export type DigDirection = "left" | "right" | "up" | "down";
