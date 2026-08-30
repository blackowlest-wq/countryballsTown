export type DistrictId = "agriculture" | "commercial" | "nature-park" | "industrial";
export type BuildDistrictId = DistrictId | "common";
export type DistrictRequirementType = "building-count" | "distinct-building-count";

export interface DistrictRequirement {
  type: DistrictRequirementType;
  buildingIds: readonly string[];
  target: number;
  label: string;
}

export interface DistrictDefinition {
  id: BuildDistrictId;
  name: string;
  icon: string;
  description: string;
  allowedBuildingIds: readonly string[];
  requirements: readonly DistrictRequirement[];
}

export interface DistrictRequirementProgress {
  requirement: DistrictRequirement;
  current: number;
  completed: boolean;
}

export interface DistrictProgress {
  definition: DistrictDefinition;
  requirements: DistrictRequirementProgress[];
  completed: boolean;
}
