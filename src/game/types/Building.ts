export type BuildingCategory = "building" | "decoration";

export interface BuildingDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
  category: BuildingCategory;
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
