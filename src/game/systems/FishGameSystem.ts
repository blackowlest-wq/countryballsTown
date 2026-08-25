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
  movementChangeIntervalMs: number;
  fishSize: number;
  catchFrameSize: number;
  catchDurationMs: number;
  timeLimitMs: number;
  description: string;
}

export interface FishingPoint {
  x: number;
  y: number;
}

export interface FishingFishMotionState {
  position: FishingPoint;
  velocity: FishingPoint;
  directionChangeInMs?: number;
}

export interface FishingChaseState {
  fish: FishingFishMotionState;
  frame: FishingPoint;
  focusProgressMs: number;
  remainingTimeMs: number;
}

export interface FishingChaseUpdate {
  state: FishingChaseState;
  isFishInFrame: boolean;
  caught: boolean;
  timedOut: boolean;
}

export type FishingRandomSource = () => number;

const FOCUS_PROGRESS_DECAY_RATE = 1.6;
const MIN_DIRECTION_CHANGE_INTERVAL_MS = 180;

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
  randomDirectionChange = Math.random(),
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
      directionChangeInMs: createDirectionChangeDelay(
        fish.movementChangeIntervalMs,
        randomDirectionChange,
      ),
    },
    frame: { x: 0.5, y: 0.5 },
    focusProgressMs: 0,
    remainingTimeMs: Math.max(0, fish.timeLimitMs),
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
  movementSpeed = Math.hypot(state.velocity.x, state.velocity.y),
  movementChangeIntervalMs = Number.POSITIVE_INFINITY,
  randomSource: FishingRandomSource = Math.random,
): FishingFishMotionState {
  const safeDeltaMs = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  if (!Number.isFinite(movementChangeIntervalMs) || movementChangeIntervalMs <= 0) {
    return advanceFishingFishPosition(state, safeDeltaMs, fishSize);
  }

  const changeIntervalMs = Math.max(MIN_DIRECTION_CHANGE_INTERVAL_MS, movementChangeIntervalMs);
  let directionChangeInMs = Number.isFinite(state.directionChangeInMs)
    ? Math.max(0, state.directionChangeInMs!)
    : changeIntervalMs;
  let remainingMs = safeDeltaMs;
  let nextState = state;

  while (directionChangeInMs <= remainingMs) {
    nextState = advanceFishingFishPosition(nextState, directionChangeInMs, fishSize);
    remainingMs -= directionChangeInMs;
    nextState = {
      ...nextState,
      velocity: createRandomFishVelocity(movementSpeed, randomSource),
    };
    directionChangeInMs = createDirectionChangeDelay(changeIntervalMs, randomSource());
  }

  nextState = advanceFishingFishPosition(nextState, remainingMs, fishSize);
  return {
    ...nextState,
    directionChangeInMs: directionChangeInMs - remainingMs,
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
  randomSource: FishingRandomSource = Math.random,
): FishingChaseUpdate {
  const safeDeltaMs = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const timeLimitMs = Math.max(
    0,
    Number.isFinite(state.remainingTimeMs) ? state.remainingTimeMs : fish.timeLimitMs,
  );
  const activeDeltaMs = Math.min(safeDeltaMs, timeLimitMs);
  const nextFish = advanceFishingFish(
    state.fish,
    activeDeltaMs,
    fish.fishSize,
    fish.movementSpeed,
    fish.movementChangeIntervalMs,
    randomSource,
  );
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
    ? Math.min(catchDurationMs, currentProgressMs + activeDeltaMs)
    : Math.max(0, currentProgressMs - activeDeltaMs * FOCUS_PROGRESS_DECAY_RATE);
  const remainingTimeMs = Math.max(0, timeLimitMs - safeDeltaMs);
  const caught = focusProgressMs >= catchDurationMs;

  return {
    state: {
      fish: nextFish,
      frame: state.frame,
      focusProgressMs,
      remainingTimeMs,
    },
    isFishInFrame,
    caught,
    timedOut: remainingTimeMs <= 0,
  };
}

function advanceFishingFishPosition(
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

function createRandomFishVelocity(
  movementSpeed: number,
  randomSource: FishingRandomSource,
): FishingPoint {
  const angle = normalizeRandom(randomSource()) * Math.PI * 2;
  const speed = Math.max(0, movementSpeed) * (0.65 + normalizeRandom(randomSource()) * 0.7);
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
}

function createDirectionChangeDelay(baseIntervalMs: number, randomValue: number): number {
  const interval = Math.max(MIN_DIRECTION_CHANGE_INTERVAL_MS, baseIntervalMs);
  return interval * (0.75 + normalizeRandom(randomValue) * 0.5);
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
