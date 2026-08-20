import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import type { Group } from "three";

export interface AnimalWanderTransform {
  x: number;
  z: number;
  rotationY: number;
}

const WANDER_SPEED = 0.28;
const X_AMPLITUDE = 0.2;
const X_DETAIL_AMPLITUDE = 0.045;
const Z_AMPLITUDE = 0.16;
const Z_DETAIL_AMPLITUDE = 0.04;

function seedToPhase(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967296) * Math.PI * 2;
}

function getAnimalWanderTransformAtPhase(
  elapsedTime: number,
  phase: number,
): AnimalWanderTransform {
  const time = elapsedTime * WANDER_SPEED + phase;
  const detailPhase = phase * 0.73;
  const xDetailTime = time * 0.47 + detailPhase;
  const zMainTime = time * 0.81 + phase * 0.41;
  const zDetailTime = time * 0.33 + phase * 1.17;
  const x = Math.sin(time) * X_AMPLITUDE + Math.sin(xDetailTime) * X_DETAIL_AMPLITUDE;
  const z = Math.cos(zMainTime) * Z_AMPLITUDE + Math.sin(zDetailTime) * Z_DETAIL_AMPLITUDE;
  const directionX =
    Math.cos(time) * X_AMPLITUDE +
    Math.cos(xDetailTime) * X_DETAIL_AMPLITUDE * 0.47;
  const directionZ =
    -Math.sin(zMainTime) * Z_AMPLITUDE * 0.81 +
    Math.cos(zDetailTime) * Z_DETAIL_AMPLITUDE * 0.33;

  return {
    x,
    z,
    // The animal models face +X, so rotate that forward vector toward the path tangent.
    rotationY: Math.atan2(-directionZ, directionX),
  };
}

export function getAnimalWanderTransform(
  elapsedTime: number,
  seed = "",
): AnimalWanderTransform {
  return getAnimalWanderTransformAtPhase(elapsedTime, seedToPhase(seed));
}

export function useAnimalWander(
  group: { current: Group | null },
  seed = "",
): void {
  const phase = useMemo(() => seedToPhase(seed), [seed]);

  useFrame(({ clock }) => {
    const animal = group.current;
    if (!animal) return;
    const transform = getAnimalWanderTransformAtPhase(clock.elapsedTime, phase);
    animal.position.x = transform.x;
    animal.position.z = transform.z;
    animal.rotation.y = transform.rotationY;
  });
}
