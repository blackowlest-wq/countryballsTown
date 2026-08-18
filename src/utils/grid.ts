import { GRID_SIZE } from "../game/constants/gameConstants";
import type { BuildingInstance } from "../game/types/Building";
import type { GridPosition } from "../game/types/GridPosition";

export function gridToWorld(position: GridPosition): { x: number; z: number } {
  return {
    x: position.x - GRID_SIZE / 2 + 0.5,
    z: position.z - GRID_SIZE / 2 + 0.5,
  };
}

export function worldToGrid(x: number, z: number): GridPosition {
  return {
    x: Math.floor(x + GRID_SIZE / 2),
    z: Math.floor(z + GRID_SIZE / 2),
  };
}

export function buildingToWorldPosition(
  building: BuildingInstance,
  width: number,
  height: number,
): { x: number; z: number } {
  return gridToWorld({
    x: building.gridX + (width - 1) / 2,
    z: building.gridY + (height - 1) / 2,
  });
}

export function isGridPositionInside(position: GridPosition): boolean {
  return (
    position.x >= 0 &&
    position.x < GRID_SIZE &&
    position.z >= 0 &&
    position.z < GRID_SIZE
  );
}
