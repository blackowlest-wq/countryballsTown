import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { GRID_SIZE } from "../../game/constants/gameConstants";

export interface AnimalWanderTransform {
  x: number;
  z: number;
  rotationY: number;
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
// The largest animal model is roughly 0.9 world units from its pivot.
// Keep this clearance when checking a fence so the body cannot pass through it
// even when the pivot itself is still outside the fence post.
export const ANIMAL_WANDER_FENCE_CLEARANCE = 0.9;

const WANDER_SEGMENT_SECONDS = 8;
const WANDER_MIN_STEP = 2.1;
const WANDER_MAX_STEP = 4.2;
const FENCE_COLLISION_HALF_SIZE = 0.46;
const ANIMAL_FENCE_COLLISION_HALF_SIZE = FENCE_COLLISION_HALF_SIZE + ANIMAL_WANDER_FENCE_CLEARANCE;
const PATH_SAMPLE_DISTANCE = 0.15;
const MAX_WANDER_FRAME_DELTA_SECONDS = 0.25;
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
    Math.abs(position.x - fence.x) <= ANIMAL_FENCE_COLLISION_HALF_SIZE &&
    Math.abs(position.z - fence.z) <= ANIMAL_FENCE_COLLISION_HALF_SIZE,
  );
}

function getFacingRotationY(
  start: AnimalWanderOrigin,
  target: AnimalWanderOrigin,
): number {
  const directionX = target.x - start.x;
  const directionZ = target.z - start.z;
  if (Math.hypot(directionX, directionZ) < Number.EPSILON) return 0;

  // Animal meshes face local +X, while Three.js rotates local +X toward -Z
  // for a positive Y rotation.
  return Math.atan2(-directionZ, directionX);
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
    rotationY: getFacingRotationY(start, target),
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
  const activeElapsedTime = useRef(0);
  const previousClockElapsedTime = useRef<number | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    const pause = (): void => {
      paused.current = true;
      previousClockElapsedTime.current = null;
    };
    const resume = (): void => {
      paused.current = false;
      previousClockElapsedTime.current = null;
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") pause();
      else resume();
    };

    window.addEventListener("pagehide", pause);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "hidden") pause();

    return () => {
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useFrame(({ clock }) => {
    const animal = group.current;
    if (!animal) return;
    const currentClockElapsedTime = clock.elapsedTime;
    const previousClockTime = previousClockElapsedTime.current;
    previousClockElapsedTime.current = currentClockElapsedTime;
    if (previousClockTime !== null && !paused.current) {
      const frameDelta = Math.max(0, currentClockElapsedTime - previousClockTime);
      activeElapsedTime.current += Math.min(frameDelta, MAX_WANDER_FRAME_DELTA_SECONDS);
    }
    if (paused.current) return;

    const transform = getAnimalWanderTransform(activeElapsedTime.current, seed, origin, fences);
    animal.position.x = transform.x;
    animal.position.z = transform.z;
    animal.rotation.y = transform.rotationY;
  });
}
