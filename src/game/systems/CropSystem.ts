import {
  CROP_GREEN_STAGE_MS,
  CROP_HARVEST_AMOUNT,
  CROP_MATURE_STAGE_MS,
  CROP_SEEDS_PER_HARVEST,
} from "../constants/gameConstants";
import { getBuildingDefinition } from "../data/buildings";
import { syncEncyclopediaCollection } from "./EncyclopediaSystem";
import type { BuildingInstance } from "../types/Building";
import {
  getCropDefinition,
  type Crop,
  type CropType,
} from "../types/Crop";
import type { GameState } from "../types/Village";
import { isGridPositionInside } from "../../utils/grid";
import { addInventory } from "./InventorySystem";

export type CropAction = "plant" | "harvest";
export type CropGrowthStage = "seed" | "green" | "mature";

export type CropActionOutcome =
  | "planted"
  | "harvested"
  | "growing"
  | "already-planted"
  | "empty"
  | "not-field"
  | "no-seeds"
  | "out-of-bounds";

export interface CropActionResult {
  outcome: CropActionOutcome;
  state: GameState;
  cropType?: CropType;
}

export function getCropName(cropType: CropType): string {
  return getCropDefinition(cropType).name;
}

export function isCellInField(
  buildings: readonly BuildingInstance[],
  gridX: number,
  gridY: number,
): boolean {
  return buildings.some((building) => {
    if (building.buildingId !== "field") return false;
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

export function getCropGrowthStage(crop: Crop, now: number): CropGrowthStage {
  const age = Math.max(0, now - crop.plantedAt);
  if (age < CROP_GREEN_STAGE_MS) return "seed";
  if (age < CROP_MATURE_STAGE_MS) return "green";
  return "mature";
}

export function isCropMature(crop: Crop, now: number): boolean {
  return getCropGrowthStage(crop, now) === "mature";
}

function isCropType(value: unknown): value is CropType {
  return value === "wheat" || value === "tomato" || value === "rice";
}

export function normalizeCrops(value: unknown, fallbackType?: CropType): Crop[] {
  if (!Array.isArray(value)) return [];
  const occupiedCells = new Set<string>();
  const crops: Crop[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<Crop>;
    const type = isCropType(candidate.type) ? candidate.type : fallbackType;
    if (
      !type ||
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
    crops.push({
      type,
      gridX: candidate.gridX as number,
      gridY: candidate.gridY as number,
      plantedAt: candidate.plantedAt,
    });
  }
  return crops;
}

function getSeedCount(state: GameState, cropType: CropType): number {
  return state[getCropDefinition(cropType).seedKey];
}

function plantCrop(
  state: GameState,
  cropType: CropType,
  gridX: number,
  gridY: number,
  now: number,
): GameState {
  const definition = getCropDefinition(cropType);
  return syncEncyclopediaCollection({
    ...state,
    [definition.seedKey]: state[definition.seedKey] - 1,
    crops: [...state.crops, { type: cropType, gridX, gridY, plantedAt: now }],
  });
}

function harvestCrop(state: GameState, crop: Crop): GameState {
  const definition = getCropDefinition(crop.type);
  const nextState = addInventory(state, definition.harvestKey, CROP_HARVEST_AMOUNT);
  return {
    ...nextState,
    [definition.seedKey]: state[definition.seedKey] + CROP_SEEDS_PER_HARVEST,
    crops: state.crops.filter((candidate) => candidate !== crop),
  };
}

export function performCropAction(
  state: GameState,
  action: CropAction,
  selectedCropType: CropType,
  gridX: number,
  gridY: number,
  now: number,
): CropActionResult {
  if (
    !Number.isInteger(gridX) ||
    !Number.isInteger(gridY) ||
    !isGridPositionInside({ x: gridX, z: gridY })
  ) {
    return { outcome: "out-of-bounds", state };
  }

  const crop = state.crops.find(
    (candidate) => candidate.gridX === gridX && candidate.gridY === gridY,
  );

  if (action === "harvest") {
    if (!crop) return { outcome: "empty", state };
    if (!isCropMature(crop, now)) {
      return { outcome: "growing", state, cropType: crop.type };
    }
    return {
      outcome: "harvested",
      state: harvestCrop(state, crop),
      cropType: crop.type,
    };
  }

  if (crop) return { outcome: "already-planted", state, cropType: crop.type };
  if (!isCellInField(state.buildings, gridX, gridY)) {
    return { outcome: "not-field", state, cropType: selectedCropType };
  }
  if (getSeedCount(state, selectedCropType) <= 0) {
    return { outcome: "no-seeds", state, cropType: selectedCropType };
  }

  return {
    outcome: "planted",
    state: plantCrop(state, selectedCropType, gridX, gridY, now),
    cropType: selectedCropType,
  };
}
