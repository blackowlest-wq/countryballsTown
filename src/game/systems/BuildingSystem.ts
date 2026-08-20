import { GRID_SIZE } from "../constants/gameConstants";
import { createBuildingCollection } from "../core/BuildingCollection";
import { getBuildingDefinition } from "../data/buildings";
import type { BuildingDefinition, BuildingInstance } from "../types/Building";
import type { GameState } from "../types/Village";
import { registerCowProduction, removeCowProduction } from "./CowSystem";

export type BuildingOperationReason =
  | "unknown-building"
  | "locked"
  | "not-enough-coins"
  | "out-of-bounds"
  | "occupied"
  | "not-found"
  | "duplicate-id"
  | "not-movable"
  | "not-removable"
  | "field-not-empty";

export interface BuildingOperationResult {
  success: boolean;
  state: GameState;
  reason?: BuildingOperationReason;
  building?: BuildingInstance;
}

function getOccupiedCells(
  buildingId: string,
  gridX: number,
  gridY: number,
): Array<{ x: number; y: number }> {
  const definition = getBuildingDefinition(buildingId);
  if (!definition) return [];
  const cells: Array<{ x: number; y: number }> = [];
  for (let x = gridX; x < gridX + definition.width; x += 1) {
    for (let y = gridY; y < gridY + definition.height; y += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

function fieldHasCrop(state: GameState, field: BuildingInstance): boolean {
  if (field.buildingId !== "field") return false;
  const occupiedCells = getOccupiedCells(field.buildingId, field.gridX, field.gridY);
  return occupiedCells.some((cell) =>
    state.wheatCrops.some((crop) => crop.gridX === cell.x && crop.gridY === cell.y)
  );
}

function isWithinGrid(definition: BuildingDefinition, gridX: number, gridY: number): boolean {
  return (
    gridX >= 0 &&
    gridY >= 0 &&
    gridX + definition.width <= GRID_SIZE &&
    gridY + definition.height <= GRID_SIZE
  );
}

function overlapsExisting(
  buildings: readonly BuildingInstance[],
  buildingId: string,
  gridX: number,
  gridY: number,
  excludeId?: string,
): boolean {
  const candidateCells = getOccupiedCells(buildingId, gridX, gridY);
  return buildings.some((existing) => {
    if (existing.id === excludeId) return false;
    const existingCells = getOccupiedCells(existing.buildingId, existing.gridX, existing.gridY);
    return candidateCells.some((candidate) =>
      existingCells.some((occupied) => candidate.x === occupied.x && candidate.y === occupied.y),
    );
  });
}

function checkPlacement(
  state: GameState,
  buildings: readonly BuildingInstance[],
  buildingId: string,
  gridX: number,
  gridY: number,
  excludeId?: string,
): { ok: boolean; reason?: BuildingOperationReason } {
  const definition = getBuildingDefinition(buildingId);
  if (!definition) return { ok: false, reason: "unknown-building" };
  if (!excludeId && !state.unlockedBuildings.includes(buildingId)) {
    return { ok: false, reason: "locked" };
  }
  if (!isWithinGrid(definition, gridX, gridY)) {
    return { ok: false, reason: "out-of-bounds" };
  }
  if (overlapsExisting(buildings, buildingId, gridX, gridY, excludeId)) {
    return { ok: false, reason: "occupied" };
  }
  const candidateCells = getOccupiedCells(buildingId, gridX, gridY);
  if (
    candidateCells.some((candidate) =>
      state.wheatCrops.some(
        (crop) => crop.gridX === candidate.x && crop.gridY === candidate.y,
      ),
    )
  ) {
    return { ok: false, reason: "occupied" };
  }
  if (!excludeId && state.coins < definition.cost) {
    return { ok: false, reason: "not-enough-coins" };
  }
  return { ok: true };
}

export function canPlaceBuilding(
  state: GameState,
  buildingId: string,
  gridX: number,
  gridY: number,
  excludeId?: string,
): { ok: boolean; reason?: BuildingOperationReason } {
  const collection = createBuildingCollection(state.buildings);
  return checkPlacement(state, collection.buildings, buildingId, gridX, gridY, excludeId);
}

export function placeBuilding(
  state: GameState,
  buildingId: string,
  gridX: number,
  gridY: number,
  instanceId?: string,
  now = Date.now(),
): BuildingOperationResult {
  const collection = createBuildingCollection(state.buildings);
  const resolvedInstanceId = instanceId ?? collection.nextId();
  const check = checkPlacement(state, collection.buildings, buildingId, gridX, gridY);
  if (!check.ok) return { success: false, state, reason: check.reason };
  if (collection.findUnique(resolvedInstanceId).status !== "not-found") {
    return { success: false, state, reason: "duplicate-id" };
  }

  const definition = getBuildingDefinition(buildingId);
  if (!definition) return { success: false, state, reason: "unknown-building" };
  const building: BuildingInstance = { id: resolvedInstanceId, buildingId, gridX, gridY };
  const placedState: GameState = {
    ...state,
    coins: state.coins - definition.cost,
    buildings: [...collection.buildings, building],
  };
  return {
    success: true,
    building,
    state: buildingId === "cow"
      ? registerCowProduction(placedState, building.id, now)
      : placedState,
  };
}

export function moveBuilding(
  state: GameState,
  instanceId: string,
  gridX: number,
  gridY: number,
): BuildingOperationResult {
  const collection = createBuildingCollection(state.buildings);
  const lookup = collection.findUnique(instanceId);
  if (lookup.status !== "found") return { success: false, state, reason: lookup.status };
  const existing = lookup.building;
  const definition = getBuildingDefinition(existing.buildingId);
  if (!definition) return { success: false, state, reason: "unknown-building" };
  if (fieldHasCrop(state, existing)) {
    return { success: false, state, reason: "field-not-empty" };
  }
  if (definition.movable === false) return { success: false, state, reason: "not-movable" };
  const check = checkPlacement(
    state,
    collection.buildings,
    existing.buildingId,
    gridX,
    gridY,
    existing.id,
  );
  if (!check.ok) return { success: false, state, reason: check.reason };
  const moved = { ...existing, gridX, gridY };
  return {
    success: true,
    building: moved,
    state: {
      ...state,
      buildings: collection.buildings.map((building, index) =>
        index === lookup.index ? moved : building,
      ),
    },
  };
}

export function removeBuilding(state: GameState, instanceId: string): BuildingOperationResult {
  const collection = createBuildingCollection(state.buildings);
  const lookup = collection.findUnique(instanceId);
  if (lookup.status !== "found") return { success: false, state, reason: lookup.status };
  const existing = lookup.building;
  const definition = getBuildingDefinition(existing.buildingId);
  if (!definition) return { success: false, state, reason: "unknown-building" };
  if (definition.removable === false) return { success: false, state, reason: "not-removable" };
  if (fieldHasCrop(state, existing)) {
    return { success: false, state, reason: "field-not-empty" };
  }
  const removedState: GameState = {
    ...state,
    buildings: collection.buildings.filter((_, index) => index !== lookup.index),
  };
  return {
    success: true,
    state: existing.buildingId === "cow"
      ? removeCowProduction(removedState, existing.id)
      : removedState,
  };
}

export function countBuildings(state: GameState, buildingId: string): number {
  return state.buildings.filter((building) => building.buildingId === buildingId).length;
}

export function getBuildingOperationMessage(reason?: BuildingOperationReason): string {
  switch (reason) {
    case "locked":
      return "まだ建築できない建物です。";
    case "not-enough-coins":
      return "コインが足りません。";
    case "out-of-bounds":
      return "村の外には配置できません。";
    case "occupied":
      return "その場所には別の建物があります。";
    case "not-movable":
      return "この建物は移動できません。";
    case "not-removable":
      return "この建物は撤去できません。";
    case "field-not-empty":
      return "作物が育っている畑は移動・撤去できません。";
    case "not-found":
      return "建物が見つかりません。";
    case "duplicate-id":
      return "建物情報に重複があります。建物を選び直してください。";
    default:
      return "建物を操作できませんでした。";
  }
}
