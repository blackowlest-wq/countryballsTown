import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { GRID_SIZE } from "../../game/constants/gameConstants";

export interface AnimalWanderTransform {
  x: number;
  z: number;
}

export interface AnimalWanderOrigin {
  x: number;
  z: number;
}

export interface AnimalWanderFence {
  x: number;
  z: number;
}

export const ANIMAL_WANDER_MAP_MARGIN = 1;

const WANDER_SEGMENT_SECONDS = 8;
const WANDER_MIN_STEP = 2.1;
const WANDER_MAX_STEP = 4.2;
const FENCE_COLLISION_HALF_SIZE = 0.46;
const PATH_SAMPLE_DISTANCE = 0.15;
const WORLD_MIN = -GRID_SIZE / 2 + ANIMAL_WANDER_MAP_MARGIN;
const WORLD_MAX = GRID_SIZE / 2 - ANIMAL_WANDER_MAP_MARGIN;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: string, segment: number, salt: number): number {
  let hash = hashSeed(`${seed}:${segment}:${salt}`);
  hash = Math.imul(hash ^ (hash >>> 16), 2246822519);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489917);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

function clampWorldPosition(position: AnimalWanderOrigin): AnimalWanderOrigin {
  return {
    x: Math.min(WORLD_MAX, Math.max(WORLD_MIN, position.x)),
    z: Math.min(WORLD_MAX, Math.max(WORLD_MIN, position.z)),
  };
}

function getNextWaypoint(
  current: AnimalWanderOrigin,
  seed: string,
  segment: number,
  fences: readonly AnimalWanderFence[],
): AnimalWanderOrigin {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const angle = seededUnit(seed, segment, attempt * 2) * Math.PI * 2;
    const distance = WANDER_MIN_STEP + seededUnit(seed, segment, attempt * 2 + 1) * (WANDER_MAX_STEP - WANDER_MIN_STEP);
    const candidate = clampWorldPosition({
      x: current.x + Math.cos(angle) * distance,
      z: current.z + Math.sin(angle) * distance,
    });
    if (!isInsideFence(candidate, fences) && isFenceFreePath(current, candidate, fences)) {
      return candidate;
    }
  }
  return current;
}

function getWaypoint(
  origin: AnimalWanderOrigin,
  seed: string,
  segment: number,
  fences: readonly AnimalWanderFence[],
): AnimalWanderOrigin {
  let waypoint = origin;
  for (let index = 0; index < segment; index += 1) {
    waypoint = getNextWaypoint(waypoint, seed, index, fences);
  }
  return waypoint;
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function isInsideFence(
  position: AnimalWanderOrigin,
  fences: readonly AnimalWanderFence[],
): boolean {
  return fences.some((fence) =>
    Math.abs(position.x - fence.x) <= FENCE_COLLISION_HALF_SIZE &&
    Math.abs(position.z - fence.z) <= FENCE_COLLISION_HALF_SIZE,
  );
}

function isFenceFreePath(
  start: AnimalWanderOrigin,
  target: AnimalWanderOrigin,
  fences: readonly AnimalWanderFence[],
): boolean {
  if (fences.length === 0) return true;
  const distance = Math.hypot(target.x - start.x, target.z - start.z);
  const sampleCount = Math.max(1, Math.ceil(distance / PATH_SAMPLE_DISTANCE));
  for (let index = 1; index <= sampleCount; index += 1) {
    const progress = index / sampleCount;
    const position = {
      x: start.x + (target.x - start.x) * progress,
      z: start.z + (target.z - start.z) * progress,
    };
    if (isInsideFence(position, fences)) return false;
  }
  return true;
}

function getAnimalWanderTransformAtTime(
  elapsedTime: number,
  seed: string,
  origin: AnimalWanderOrigin,
  fences: readonly AnimalWanderFence[],
): AnimalWanderTransform {
  const safeElapsedTime = Math.max(0, elapsedTime);
  const segment = Math.floor(safeElapsedTime / WANDER_SEGMENT_SECONDS);
  const progress = (safeElapsedTime % WANDER_SEGMENT_SECONDS) / WANDER_SEGMENT_SECONDS;
  const start = getWaypoint(origin, seed, segment, fences);
  const target = getWaypoint(origin, seed, segment + 1, fences);
  const easedProgress = smoothStep(progress);
  const worldX = start.x + (target.x - start.x) * easedProgress;
  const worldZ = start.z + (target.z - start.z) * easedProgress;

  return {
    // The animal is rendered inside its building group, so expose the route
    // as an offset from the building's world position.
    x: worldX - origin.x,
    z: worldZ - origin.z,
  };
}

export function getAnimalWanderTransform(
  elapsedTime: number,
  seed = "",
  origin: AnimalWanderOrigin = { x: 0, z: 0 },
  fences: readonly AnimalWanderFence[] = [],
): AnimalWanderTransform {
  return getAnimalWanderTransformAtTime(elapsedTime, seed, origin, fences);
}

export function useAnimalWander(
  group: { current: Group | null },
  seed = "",
  origin: AnimalWanderOrigin = { x: 0, z: 0 },
  fences: readonly AnimalWanderFence[] = [],
): void {
  useFrame(({ clock }) => {
    const animal = group.current;
    if (!animal) return;
    const transform = getAnimalWanderTransform(clock.elapsedTime, seed, origin, fences);
    animal.position.x = transform.x;
    animal.position.z = transform.z;
  });
}
