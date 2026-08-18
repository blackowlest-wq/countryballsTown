import { GRID_SIZE, RESIDENT_WALK_SPEED } from "../constants/gameConstants";
import type { GridPosition } from "../types/GridPosition";

export function distanceBetween(a: GridPosition, b: GridPosition): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function moveTowards(
  current: GridPosition,
  destination: GridPosition,
  deltaMs: number,
  speed = RESIDENT_WALK_SPEED,
): GridPosition {
  const distance = distanceBetween(current, destination);
  if (distance === 0) return destination;
  const step = Math.min(distance, Math.max(0, deltaMs) / 1000 * speed);
  const ratio = step / distance;
  return {
    x: current.x + (destination.x - current.x) * ratio,
    z: current.z + (destination.z - current.z) * ratio,
  };
}

export function clampToMap(position: GridPosition): GridPosition {
  return {
    x: Math.min(GRID_SIZE - 0.5, Math.max(0.5, position.x)),
    z: Math.min(GRID_SIZE - 0.5, Math.max(0.5, position.z)),
  };
}
