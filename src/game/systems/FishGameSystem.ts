import type { FishRarity, FishType } from "../types/Fish";

export interface FishDefinition {
  type: FishType;
  name: string;
  icon: string;
  rarity: FishRarity;
  rarityLabel: string;
  probability: number;
  biteWindowMs: number;
  gaugeSpeed: number;
  gaugeTargetWidth: number;
  description: string;
}

export interface FishingGaugeState {
  position: number;
  direction: -1 | 1;
}

export interface FishingGaugeTarget {
  start: number;
  end: number;
}

export function chooseFishDefinition(
  definitions: readonly FishDefinition[],
  randomValue = Math.random(),
): FishDefinition {
  const fallback = definitions.at(-1) ?? definitions[0];
  if (!fallback) throw new Error("Fish definitions are empty.");
  const normalizedRandom = Math.min(0.999999, Math.max(0, randomValue));
  let remaining = normalizedRandom;
  for (const definition of definitions) {
    if (remaining < definition.probability) return definition;
    remaining -= definition.probability;
  }
  return fallback;
}

export function createFishingGaugeTarget(
  fish: FishDefinition,
  randomValue = Math.random(),
): FishingGaugeTarget {
  const maxStart = Math.max(0, 1 - fish.gaugeTargetWidth);
  const start = Math.min(1, Math.max(0, randomValue)) * maxStart;
  return {
    start,
    end: start + fish.gaugeTargetWidth,
  };
}

export function advanceFishingGauge(
  state: FishingGaugeState,
  deltaMs: number,
  speedPerSecond: number,
): FishingGaugeState {
  let position = state.position + state.direction * Math.max(0, deltaMs) * speedPerSecond / 1_000;
  let direction = state.direction;
  while (position < 0 || position > 1) {
    if (position > 1) {
      position = 2 - position;
      direction = -1;
    } else if (position < 0) {
      position = -position;
      direction = 1;
    }
  }
  return { position, direction };
}

export function isFishingGaugeInTarget(
  position: number,
  target: FishingGaugeTarget,
): boolean {
  return position >= target.start && position <= target.end;
}
