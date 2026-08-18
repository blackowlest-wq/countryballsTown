import { GRID_SIZE } from "../constants/gameConstants";
import { getBuildingDefinition } from "../data/buildings";
import type { BuildingDefinition, BuildingInstance } from "../types/Building";
import type { GameState } from "../types/Village";

export type BuildingOperationReason =
  | "unknown-building"
  | "locked"
  | "not-enough-coins"
  | "out-of-bounds"
  | "occupied"
  | "not-found"
  | "not-movable"
  | "not-removable";

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

function isWithinGrid(definition: BuildingDefinition, gridX: number, gridY: number): boolean {
  return (
    gridX >= 0 &&
    gridY >= 0 &&
    gridX + definition.width <= GRID_SIZE &&
    gridY + definition.height <= GRID_SIZE
  );
}

function overlapsExisting(
  state: GameState,
  buildingId: string,
  gridX: number,
  gridY: number,
  excludeId?: string,
): boolean {
  const candidateCells = getOccupiedCells(buildingId, gridX, gridY);
  return state.buildings.some((existing) => {
    if (existing.id === excludeId) return false;
    const existingCells = getOccupiedCells(existing.buildingId, existing.gridX, existing.gridY);
    return candidateCells.some((candidate) =>
      existingCells.some((occupied) => candidate.x === occupied.x && candidate.y === occupied.y),
    );
  });
}

export function canPlaceBuilding(
  state: GameState,
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
  if (overlapsExisting(state, buildingId, gridX, gridY, excludeId)) {
    return { ok: false, reason: "occupied" };
  }
  if (!excludeId && state.coins < definition.cost) {
    return { ok: false, reason: "not-enough-coins" };
  }
  return { ok: true };
}

export function placeBuilding(
  state: GameState,
  buildingId: string,
  gridX: number,
  gridY: number,
  instanceId = `building-${state.buildings.length + 1}`,
): BuildingOperationResult {
  const check = canPlaceBuilding(state, buildingId, gridX, gridY);
  if (!check.ok) return { success: false, state, reason: check.reason };

  const definition = getBuildingDefinition(buildingId);
  if (!definition) return { success: false, state, reason: "unknown-building" };
  const building: BuildingInstance = { id: instanceId, buildingId, gridX, gridY };
  return {
    success: true,
    building,
    state: {
      ...state,
      coins: state.coins - definition.cost,
      buildings: [...state.buildings, building],
    },
  };
}

export function moveBuilding(
  state: GameState,
  instanceId: string,
  gridX: number,
  gridY: number,
): BuildingOperationResult {
  const existing = state.buildings.find((building) => building.id === instanceId);
  if (!existing) return { success: false, state, reason: "not-found" };
  const definition = getBuildingDefinition(existing.buildingId);
  if (!definition) return { success: false, state, reason: "unknown-building" };
  if (definition.movable === false) return { success: false, state, reason: "not-movable" };
  const check = canPlaceBuilding(state, existing.buildingId, gridX, gridY, instanceId);
  if (!check.ok) return { success: false, state, reason: check.reason };
  const moved = { ...existing, gridX, gridY };
  return {
    success: true,
    building: moved,
    state: {
      ...state,
      buildings: state.buildings.map((building) =>
        building.id === instanceId ? moved : building,
      ),
    },
  };
}

export function removeBuilding(state: GameState, instanceId: string): BuildingOperationResult {
  const existing = state.buildings.find((building) => building.id === instanceId);
  if (!existing) return { success: false, state, reason: "not-found" };
  const definition = getBuildingDefinition(existing.buildingId);
  if (!definition) return { success: false, state, reason: "unknown-building" };
  if (definition.removable === false) return { success: false, state, reason: "not-removable" };
  return {
    success: true,
    state: {
      ...state,
      buildings: state.buildings.filter((building) => building.id !== instanceId),
    },
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
    case "not-found":
      return "建物が見つかりません。";
    default:
      return "建物を操作できませんでした。";
  }
}
