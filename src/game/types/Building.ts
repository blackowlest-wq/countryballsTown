import type { CraftingProductType } from "./Crafting";
import type { MiningResourceCost } from "./Mining";

export type BuildingCategory = "building" | "nature";
export type ResidentCollision = "blocking" | "passable";

export interface BuildingCategoryDefinition {
  id: BuildingCategory;
  name: string;
  icon: string;
}

export interface ResidentCollisionPadding {
  x: number;
  z: number;
}

export interface VisitorServiceDefinition {
  queueCapacity: number;
  saleCoins: number;
  doorOffset?: number;
  /** A legacy single-product entry kept for existing saved definitions. */
  product?: CraftingProductType;
  products?: readonly CraftingProductType[];
}

export interface BuildingDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
  miningCost?: MiningResourceCost;
  category: BuildingCategory;
  menuIcon: string;
  residentCollision: ResidentCollision;
  residentCollisionPadding?: ResidentCollisionPadding;
  countryId?: string;
  interactionType?: string;
  visitorService?: VisitorServiceDefinition;
  description: string;
  movable?: boolean;
  removable?: boolean;
}

export interface BuildingInstance {
  id: string;
  buildingId: string;
  gridX: number;
  gridY: number;
}
