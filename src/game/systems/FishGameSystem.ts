import type { FishRarity, FishType } from "../types/Fish";

export interface FishDefinition {
  type: FishType;
  name: string;
  icon: string;
  rarity: FishRarity;
  rarityLabel: string;
  probability: number;
  biteWindowMs: number;
  movementSpeed: number;
  fishSize: number;
  catchFrameSize: number;
  catchDurationMs: number;
  description: string;
}

export interface FishingPoint {
  x: number;
  y: number;
}

export interface FishingFishMotionState {
  position: FishingPoint;
  velocity: FishingPoint;
}

export interface FishingChaseState {
  fish: FishingFishMotionState;
  frame: FishingPoint;
  focusProgressMs: number;
}

export interface FishingChaseUpdate {
  state: FishingChaseState;
  isFishInFrame: boolean;
  caught: boolean;
}

const FOCUS_PROGRESS_DECAY_RATE = 1.6;

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

export function createFishingChaseState(
  fish: FishDefinition,
  randomX = Math.random(),
  randomY = Math.random(),
  randomDirection = Math.random(),
): FishingChaseState {
  const fishSize = clamp(fish.fishSize, 0, 1);
  const margin = fishSize / 2;
  const angle = normalizeRandom(randomDirection) * Math.PI * 2;

  return {
    fish: {
      position: {
        x: margin + normalizeRandom(randomX) * (1 - fishSize),
        y: margin + normalizeRandom(randomY) * (1 - fishSize),
      },
      velocity: {
        x: Math.cos(angle) * Math.max(0, fish.movementSpeed),
        y: Math.sin(angle) * Math.max(0, fish.movementSpeed),
      },
    },
    frame: { x: 0.5, y: 0.5 },
    focusProgressMs: 0,
  };
}

export function moveFishingFrameToTap(
  currentFrame: FishingPoint,
  tapPosition: FishingPoint,
  frameSize: number,
): FishingPoint {
  const halfFrame = clamp(frameSize, 0, 1) / 2;
  return {
    x: clamp(normalizePointValue(tapPosition.x, currentFrame.x), halfFrame, 1 - halfFrame),
    y: clamp(normalizePointValue(tapPosition.y, currentFrame.y), halfFrame, 1 - halfFrame),
  };
}

export function advanceFishingFish(
  state: FishingFishMotionState,
  deltaMs: number,
  fishSize: number,
): FishingFishMotionState {
  const deltaSeconds = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0) / 1_000;
  const margin = clamp(fishSize, 0, 1) / 2;
  const x = advanceBoundedAxis(state.position.x, state.velocity.x, deltaSeconds, margin, 1 - margin);
  const y = advanceBoundedAxis(state.position.y, state.velocity.y, deltaSeconds, margin, 1 - margin);
  return {
    position: { x: x.position, y: y.position },
    velocity: { x: x.velocity, y: y.velocity },
  };
}

export function isFishingFishInFrame(
  fishPosition: FishingPoint,
  framePosition: FishingPoint,
  frameSize: number,
  fishSize: number,
): boolean {
  const halfFrame = clamp(frameSize, 0, 1) / 2;
  const halfFish = clamp(fishSize, 0, 1) / 2;
  return Math.abs(fishPosition.x - framePosition.x) <= halfFrame + halfFish
    && Math.abs(fishPosition.y - framePosition.y) <= halfFrame + halfFish;
}

export function advanceFishingChase(
  state: FishingChaseState,
  fish: FishDefinition,
  deltaMs: number,
): FishingChaseUpdate {
  const safeDeltaMs = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const nextFish = advanceFishingFish(state.fish, safeDeltaMs, fish.fishSize);
  const isFishInFrame = isFishingFishInFrame(
    nextFish.position,
    state.frame,
    fish.catchFrameSize,
    fish.fishSize,
  );
  const catchDurationMs = Math.max(1, fish.catchDurationMs);
  const currentProgressMs = clamp(
    Number.isFinite(state.focusProgressMs) ? state.focusProgressMs : 0,
    0,
    catchDurationMs,
  );
  const focusProgressMs = isFishInFrame
    ? Math.min(catchDurationMs, currentProgressMs + safeDeltaMs)
    : Math.max(0, currentProgressMs - safeDeltaMs * FOCUS_PROGRESS_DECAY_RATE);

  return {
    state: {
      fish: nextFish,
      frame: state.frame,
      focusProgressMs,
    },
    isFishInFrame,
    caught: focusProgressMs >= catchDurationMs,
  };
}

function advanceBoundedAxis(
  position: number,
  velocity: number,
  deltaSeconds: number,
  min: number,
  max: number,
): { position: number; velocity: number } {
  if (max <= min) return { position: min, velocity: 0 };

  let nextPosition = clamp(normalizePointValue(position, (min + max) / 2), min, max)
    + velocity * deltaSeconds;
  let nextVelocity = Number.isFinite(velocity) ? velocity : 0;
  while (nextPosition < min || nextPosition > max) {
    if (nextPosition > max) {
      nextPosition = max - (nextPosition - max);
      nextVelocity = -Math.abs(nextVelocity);
    } else {
      nextPosition = min + (min - nextPosition);
      nextVelocity = Math.abs(nextVelocity);
    }
  }
  return { position: nextPosition, velocity: nextVelocity };
}

function normalizeRandom(value: number): number {
  return clamp(Number.isFinite(value) ? value : 0.5, 0, 1);
}

function normalizePointValue(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
