import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import type { Group } from "three";

export interface AnimalWanderTransform {
  x: number;
  z: number;
}

const WANDER_SPEED = 0.28;
const X_AMPLITUDE = 0.3;
const X_DETAIL_AMPLITUDE = 0.055;
const Z_AMPLITUDE = 0.25;
const Z_DETAIL_AMPLITUDE = 0.05;

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

  return {
    x,
    z,
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
  });
}
