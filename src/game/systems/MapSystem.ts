import { GRID_SIZE } from "../constants/gameConstants";
import type { GridPosition } from "../types/GridPosition";
import type { MapId, MapResidentActivity } from "../types/Map";
import type { GameState } from "../types/Village";
import { clampToMap } from "./MovementSystem";

export const SEA_START_X = 13.4;
export const RIVER_HALF_WIDTH = 0.95;
const RIVER_MOUTH_HALF_WIDTH = 1.4;
const RIVER_START_X = 7.2;
const RIVER_MOUTH_X = SEA_START_X + 0.65;
const RIVER_START_Z = 0.8;
const RIVER_MOUTH_Z = 17.8;
const RIVER_WINDING = 0.42;

export interface RiverPathPoint {
  x: number;
  z: number;
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getRiverProgress(z: number): number {
  return clampUnit((z - RIVER_START_Z) / (RIVER_MOUTH_Z - RIVER_START_Z));
}

export function getRiverCenterX(z: number): number {
  const progress = getRiverProgress(z);
  const mouthBend = Math.pow(progress, 2.3);
  const winding = Math.sin(progress * Math.PI * 2.4) * RIVER_WINDING * (1 - progress);
  return RIVER_START_X + (RIVER_MOUTH_X - RIVER_START_X) * mouthBend + winding;
}

export function getRiverHalfWidth(z: number): number {
  const mouthBend = Math.pow(getRiverProgress(z), 2.2);
  return RIVER_HALF_WIDTH + (RIVER_MOUTH_HALF_WIDTH - RIVER_HALF_WIDTH) * mouthBend;
}

export function getRiverPathPoints(sampleCount = 48): RiverPathPoint[] {
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const z = RIVER_START_Z + (RIVER_MOUTH_Z - RIVER_START_Z) * index / sampleCount;
    return { x: getRiverCenterX(z), z };
  });
}

export function isMapId(value: unknown): value is MapId {
  return value === "village" || value === "sea-and-river";
}

export function isMapPositionWalkable(mapId: MapId, position: GridPosition): boolean {
  if (mapId === "village") return true;
  if (position.x >= SEA_START_X) return false;
  return Math.abs(position.x - getRiverCenterX(position.z)) > getRiverHalfWidth(position.z);
}

export function getMapArrivalPosition(mapId: MapId, residentIndex: number): GridPosition {
  if (mapId === "village") {
    return clampToMap({ x: 6.5 + (residentIndex % 3) * 1.25, z: 5.5 });
  }
  return clampToMap({ x: 9.2 + (residentIndex % 4) * 0.8, z: 17.2 });
}

function getMapArrivalDestination(mapId: MapId, residentIndex: number): GridPosition {
  if (mapId === "village") {
    return clampToMap({ x: 7.5 + (residentIndex % 3) * 1.25, z: 7.2 });
  }
  return clampToMap({ x: 9.2 + (residentIndex % 4) * 0.5, z: 15.5 });
}

export function getMapActivityPosition(
  activity: MapResidentActivity,
  residentIndex: number,
): GridPosition {
  if (activity === "fishing") {
    return clampToMap({ x: SEA_START_X - 0.55, z: 3.8 + (residentIndex % 4) * 3.25 });
  }
  const z = 3.4 + (residentIndex % 4) * 3.7;
  const riverCenter = getRiverCenterX(z);
  const riverBankOffset = getRiverHalfWidth(z) + 0.55;
  const rightBank = riverCenter + riverBankOffset;
  const leftBank = riverCenter - riverBankOffset;
  return clampToMap({ x: rightBank < SEA_START_X ? rightBank : leftBank, z });
}

export function travelToMap(state: GameState, mapId: MapId, now: number): GameState {
  if (state.currentMap === mapId) return state;
  return {
    ...state,
    currentMap: mapId,
    residents: state.residents.map((resident, index) => ({
      ...resident,
      position: getMapArrivalPosition(mapId, index),
      state: "walking",
      motion: "idle",
      destination: getMapArrivalDestination(mapId, index),
      actionBuildingId: undefined,
      actionUntil: undefined,
      nextDecisionAt: undefined,
      motionStartedAt: now,
      motionUntil: undefined,
      lookAt: undefined,
      targetResidentId: undefined,
    })),
  };
}

export function getMapSize(): number {
  return GRID_SIZE;
}
