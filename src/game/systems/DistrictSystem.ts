import { districtDefinitions, getDistrictDefinition } from "../data/districts";
import type {
  BuildDistrictId,
  DistrictId,
  DistrictProgress,
  DistrictRequirement,
  DistrictRequirementProgress,
} from "../types/District";
import type { GameState } from "../types/Village";

function getRequirementCount(
  state: Pick<GameState, "buildings">,
  requirement: DistrictRequirement,
): number {
  if (requirement.type === "distinct-building-count") {
    return requirement.buildingIds.filter((buildingId) =>
      state.buildings.some((building) => building.buildingId === buildingId),
    ).length;
  }
  return state.buildings.filter((building) =>
    requirement.buildingIds.includes(building.buildingId),
  ).length;
}

export function getDistrictProgress(
  state: Pick<GameState, "buildings">,
  districtId: DistrictId,
): DistrictProgress {
  const definition = getDistrictDefinition(districtId);
  if (!definition || definition.id === "common") {
    throw new Error(`Unknown goal district: ${districtId}`);
  }
  const requirements: DistrictRequirementProgress[] = definition.requirements.map((requirement) => {
    const current = Math.min(requirement.target, getRequirementCount(state, requirement));
    return {
      requirement,
      current,
      completed: current >= requirement.target,
    };
  });
  return {
    definition,
    requirements,
    completed: requirements.every((requirement) => requirement.completed),
  };
}

export function getAllDistrictProgress(
  state: Pick<GameState, "buildings">,
): DistrictProgress[] {
  return districtDefinitions.map((definition) => getDistrictProgress(state, definition.id));
}

export function isBuildingAllowedInDistrict(
  districtId: BuildDistrictId,
  buildingId: string,
): boolean {
  return getDistrictDefinition(districtId)?.allowedBuildingIds.includes(buildingId) ?? false;
}
