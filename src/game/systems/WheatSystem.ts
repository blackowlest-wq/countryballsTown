import {
  WHEAT_GREEN_STAGE_MS,
  WHEAT_HARVEST_AMOUNT,
  WHEAT_MATURE_STAGE_MS,
} from "../constants/gameConstants";
import { getBuildingDefinition } from "../data/buildings";
import type { WheatCrop } from "../types/Crop";
import type { GameState } from "../types/Village";
import { isGridPositionInside } from "../../utils/grid";

export type WheatAction = "plant" | "harvest";
export type WheatGrowthStage = "seed" | "green" | "mature";

export type WheatActionOutcome =
  | "planted"
  | "harvested"
  | "growing"
  | "already-planted"
  | "empty"
  | "occupied"
  | "out-of-bounds";

export interface WheatActionResult {
  outcome: WheatActionOutcome;
  state: GameState;
}

function buildingOccupiesCell(
  state: Pick<GameState, "buildings">,
  gridX: number,
  gridY: number,
): boolean {
  return state.buildings.some((building) => {
    const definition = getBuildingDefinition(building.buildingId);
    if (!definition) return false;
    return (
      gridX >= building.gridX &&
      gridX < building.gridX + definition.width &&
      gridY >= building.gridY &&
      gridY < building.gridY + definition.height
    );
  });
}

export function getWheatGrowthStage(crop: WheatCrop, now: number): WheatGrowthStage {
  const age = Math.max(0, now - crop.plantedAt);
  if (age < WHEAT_GREEN_STAGE_MS) return "seed";
  if (age < WHEAT_MATURE_STAGE_MS) return "green";
  return "mature";
}

export function isWheatMature(crop: WheatCrop, now: number): boolean {
  return getWheatGrowthStage(crop, now) === "mature";
}

export function normalizeWheatCrops(value: unknown): WheatCrop[] {
  if (!Array.isArray(value)) return [];
  const occupiedCells = new Set<string>();
  const crops: WheatCrop[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<WheatCrop>;
    if (
      !Number.isInteger(candidate.gridX) ||
      !Number.isInteger(candidate.gridY) ||
      typeof candidate.plantedAt !== "number" ||
      !Number.isFinite(candidate.plantedAt) ||
      !isGridPositionInside({ x: candidate.gridX as number, z: candidate.gridY as number })
    ) {
      continue;
    }
    const key = `${candidate.gridX}:${candidate.gridY}`;
    if (occupiedCells.has(key)) continue;
    occupiedCells.add(key);
    crops.push(candidate as WheatCrop);
  }
  return crops;
}

export function performWheatAction(
  state: GameState,
  action: WheatAction,
  gridX: number,
  gridY: number,
  now: number,
): WheatActionResult {
  if (
    !Number.isInteger(gridX) ||
    !Number.isInteger(gridY) ||
    !isGridPositionInside({ x: gridX, z: gridY })
  ) {
    return { outcome: "out-of-bounds", state };
  }

  const crop = state.wheatCrops.find(
    (candidate) => candidate.gridX === gridX && candidate.gridY === gridY,
  );

  if (action === "harvest") {
    if (!crop) return { outcome: "empty", state };
    if (!isWheatMature(crop, now)) return { outcome: "growing", state };
    return {
      outcome: "harvested",
      state: {
        ...state,
        wheat: state.wheat + WHEAT_HARVEST_AMOUNT,
        wheatCrops: state.wheatCrops.filter((candidate) => candidate !== crop),
      },
    };
  }

  if (crop) return { outcome: "already-planted", state };
  if (buildingOccupiesCell(state, gridX, gridY)) {
    return { outcome: "occupied", state };
  }

  return {
    outcome: "planted",
    state: {
      ...state,
      wheatCrops: [...state.wheatCrops, { gridX, gridY, plantedAt: now }],
    },
  };
}
