export type BuildingCategory = "building" | "decoration";
export type ResidentCollision = "blocking" | "passable";

export interface ResidentCollisionPadding {
  x: number;
  z: number;
}

export interface BuildingDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
  category: BuildingCategory;
  residentCollision: ResidentCollision;
  residentCollisionPadding?: ResidentCollisionPadding;
  countryId?: string;
  interactionType?: string;
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
