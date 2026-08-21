import { GRID_SIZE } from "../constants/gameConstants";
import type { GridPosition } from "../types/GridPosition";
import type { MapId, MapResidentActivity } from "../types/Map";
import type { GameState } from "../types/Village";
import { clampToMap } from "./MovementSystem";

export const SEA_START_X = 14.6;
const RIVER_CENTER_X = 8.1;
const RIVER_WINDING = 1.2;
const RIVER_HALF_WIDTH = 1.05;

export function getRiverCenterX(z: number): number {
  return RIVER_CENTER_X + Math.sin(z * 0.42) * RIVER_WINDING;
}

export function isMapId(value: unknown): value is MapId {
  return value === "village" || value === "sea-and-river";
}

export function isMapPositionWalkable(mapId: MapId, position: GridPosition): boolean {
  if (mapId === "village") return true;
  if (position.x >= SEA_START_X) return false;
  return Math.abs(position.x - getRiverCenterX(position.z)) > RIVER_HALF_WIDTH;
}

export function getMapArrivalPosition(mapId: MapId, residentIndex: number): GridPosition {
  if (mapId === "village") {
    return clampToMap({ x: 6.5 + (residentIndex % 3) * 1.25, z: 5.5 });
  }
  return clampToMap({ x: 10.7 + (residentIndex % 4) * 0.8, z: 17.2 });
}

function getMapArrivalDestination(mapId: MapId, residentIndex: number): GridPosition {
  if (mapId === "village") {
    return clampToMap({ x: 7.5 + (residentIndex % 3) * 1.25, z: 7.2 });
  }
  return clampToMap({ x: 11.2 + (residentIndex % 4) * 0.8, z: 15.5 });
}

export function getMapActivityPosition(
  activity: MapResidentActivity,
  residentIndex: number,
): GridPosition {
  if (activity === "fishing") {
    return clampToMap({ x: SEA_START_X - 0.55, z: 3.8 + (residentIndex % 4) * 3.25 });
  }
  const z = 3.4 + (residentIndex % 4) * 3.7;
  return clampToMap({ x: getRiverCenterX(z) + RIVER_HALF_WIDTH + 0.55, z });
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
