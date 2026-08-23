import {
  CAVE_DRILL_HARDNESS_PER_LEVEL,
  CAVE_FUEL_PURCHASE_AMOUNT,
  CAVE_FUEL_PURCHASE_COST,
  CAVE_FUEL_TANK_CAPACITY_PER_LEVEL,
  CAVE_INITIAL_DRILL_HARDNESS,
  CAVE_INITIAL_FUEL,
  CAVE_INITIAL_FUEL_TANK_CAPACITY,
  CAVE_INITIAL_MINING_CAPACITY,
  CAVE_MAX_DEPTH,
  CAVE_MINING_CAPACITY_PER_LEVEL,
  CAVE_ROCK_BREAKING_POWER_PER_FUEL,
  CAVE_UPGRADE_BASE_COST,
  CAVE_WIDTH,
} from "../constants/gameConstants";
import {
  getMiningResourceDefinition,
  normalizeMiningInventory,
} from "../data/mining";
import type {
  CaveMiningState,
  CavePosition,
  DigDirection,
  MiningInventory,
  MiningResourceType,
} from "../types/Mining";
import type { GameState } from "../types/Village";

export const CAVE_START_POSITION: CavePosition = { x: Math.floor(CAVE_WIDTH / 2), depth: 0 };

interface CaveLayoutCell {
  hardness?: number;
  resourceType?: MiningResourceType;
}

export interface CaveCell {
  position: CavePosition;
  hardness: number;
  resourceType: MiningResourceType | null;
}

const caveLayout: Readonly<Record<string, CaveLayoutCell>> = {
  "2:0": { resourceType: "copper" },
  "4:0": { resourceType: "fossil" },
  "3:1": { resourceType: "iron" },
  "2:1": { resourceType: "glowing-mushroom" },
  "4:1": { resourceType: "crystal" },
  "1:2": { resourceType: "fossil" },
  "3:2": { resourceType: "gold" },
  "5:2": { resourceType: "amber" },
  "3:3": { resourceType: "ancient-relic" },
  "2:4": { resourceType: "crystal" },
  "4:4": { resourceType: "gold" },
  "3:5": { resourceType: "diamond" },
  "1:6": { resourceType: "ancient-relic" },
  "5:6": { resourceType: "diamond" },
  "3:8": { hardness: 5, resourceType: "gold" },
  "2:9": { hardness: 5, resourceType: "ancient-relic" },
  "4:10": { hardness: 5, resourceType: "amber" },
  "3:12": { hardness: 6, resourceType: "diamond" },
  "1:13": { hardness: 5, resourceType: "fossil" },
  "5:14": { hardness: 6, resourceType: "diamond" },
  "3:15": { hardness: 6, resourceType: "diamond" },
};

export type CaveDigOutcome =
  | "dug"
  | "moved"
  | "no-fuel"
  | "too-hard"
  | "capacity-full"
  | "boundary";

export interface CaveDigResult {
  ok: boolean;
  state: GameState;
  outcome: CaveDigOutcome;
  target?: CavePosition;
  targetHardness?: number;
  resourceType?: MiningResourceType;
  fuelConsumed: number;
  rockBreakingPower: number;
}

export type CaveUpgradeKind = "drill" | "fuel-tank" | "mining-capacity";
export type CaveUpgradeFailureReason = "not-enough-coins";

export interface CaveUpgradeResult {
  ok: boolean;
  state: GameState;
  reason?: CaveUpgradeFailureReason;
}

export type CaveFuelPurchaseFailureReason = "fuel-not-empty" | "not-enough-coins";

export interface CaveFuelPurchaseResult {
  ok: boolean;
  state: GameState;
  reason?: CaveFuelPurchaseFailureReason;
}

export function createInitialCaveMiningState(): CaveMiningState {
  return {
    fuel: CAVE_INITIAL_FUEL,
    fuelTankLevel: 0,
    drillLevel: 0,
    miningCapacityLevel: 0,
    position: { ...CAVE_START_POSITION },
    excavatedCells: [getCaveCellKey(CAVE_START_POSITION)],
  };
}

function asNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function isCavePosition(value: unknown): value is CavePosition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CavePosition>;
  return (
    typeof candidate.x === "number" &&
    Number.isInteger(candidate.x) &&
    candidate.x >= 0 &&
    candidate.x < CAVE_WIDTH &&
    typeof candidate.depth === "number" &&
    Number.isInteger(candidate.depth) &&
    candidate.depth >= 0 &&
    candidate.depth <= CAVE_MAX_DEPTH
  );
}

export function getCaveCellKey(position: CavePosition): string {
  return `${position.x}:${position.depth}`;
}

function parseCaveCellKey(value: string): CavePosition | null {
  const [xValue, depthValue] = value.split(":");
  const x = Number(xValue);
  const depth = Number(depthValue);
  const position = { x, depth };
  return isCavePosition(position) ? position : null;
}

export function normalizeCaveMiningState(value: unknown): CaveMiningState {
  const initial = createInitialCaveMiningState();
  const candidate = value && typeof value === "object"
    ? value as Partial<CaveMiningState>
    : {};
  const fuelTankLevel = asNonNegativeInteger(candidate.fuelTankLevel, initial.fuelTankLevel);
  const drillLevel = asNonNegativeInteger(candidate.drillLevel, initial.drillLevel);
  const miningCapacityLevel = asNonNegativeInteger(
    candidate.miningCapacityLevel,
    initial.miningCapacityLevel,
  );
  const fuelTankCapacity = getFuelTankCapacity({ fuelTankLevel });
  const position = isCavePosition(candidate.position)
    ? { ...candidate.position }
    : { ...initial.position };
  const excavatedCells = Array.isArray(candidate.excavatedCells)
    ? candidate.excavatedCells
      .filter((cellKey): cellKey is string => typeof cellKey === "string")
      .map(parseCaveCellKey)
      .filter((cell): cell is CavePosition => cell !== null)
      .map(getCaveCellKey)
    : [];
  const uniqueExcavatedCells = [...new Set([
    getCaveCellKey(CAVE_START_POSITION),
    ...excavatedCells,
  ])];
  return {
    fuel: clampInteger(candidate.fuel, 0, fuelTankCapacity, Math.min(initial.fuel, fuelTankCapacity)),
    fuelTankLevel,
    drillLevel,
    miningCapacityLevel,
    position,
    excavatedCells: uniqueExcavatedCells,
  };
}

export function getFuelTankCapacity(
  state: Pick<CaveMiningState, "fuelTankLevel">,
): number {
  return CAVE_INITIAL_FUEL_TANK_CAPACITY
    + state.fuelTankLevel * CAVE_FUEL_TANK_CAPACITY_PER_LEVEL;
}

export function getDrillHardness(
  state: Pick<CaveMiningState, "drillLevel">,
): number {
  return CAVE_INITIAL_DRILL_HARDNESS + state.drillLevel * CAVE_DRILL_HARDNESS_PER_LEVEL;
}

export function getMiningCapacity(
  state: Pick<CaveMiningState, "miningCapacityLevel">,
): number {
  return CAVE_INITIAL_MINING_CAPACITY
    + state.miningCapacityLevel * CAVE_MINING_CAPACITY_PER_LEVEL;
}

export function getMiningInventoryTotal(inventory: MiningInventory): number {
  return Object.values(normalizeMiningInventory(inventory))
    .reduce((total, amount) => total + amount, 0);
}

export function getCaveUpgradeCost(
  state: CaveMiningState,
  kind: CaveUpgradeKind,
): number {
  const level = kind === "drill"
    ? state.drillLevel
    : kind === "fuel-tank"
      ? state.fuelTankLevel
      : state.miningCapacityLevel;
  return CAVE_UPGRADE_BASE_COST * (2 ** level);
}

export function getCaveCell(position: CavePosition): CaveCell | null {
  if (!isCavePosition(position)) return null;
  const layoutCell = caveLayout[getCaveCellKey(position)];
  const resourceType = layoutCell?.resourceType ?? null;
  const resourceHardness = resourceType
    ? getMiningResourceDefinition(resourceType).hardness
    : undefined;
  const baseHardness = Math.min(6, 1 + Math.floor(position.depth / 2));
  return {
    position: { ...position },
    hardness: layoutCell?.hardness ?? resourceHardness ?? baseHardness,
    resourceType,
  };
}

export function isCaveCellExcavated(state: CaveMiningState, position: CavePosition): boolean {
  return state.excavatedCells.includes(getCaveCellKey(position));
}

export function getTargetPosition(
  position: CavePosition,
  direction: DigDirection,
): CavePosition | null {
  const target = direction === "left"
    ? { x: position.x - 1, depth: position.depth }
    : direction === "right"
      ? { x: position.x + 1, depth: position.depth }
      : { x: position.x, depth: position.depth + 1 };
  return isCavePosition(target) ? target : null;
}

function getFailureResult(
  state: GameState,
  outcome: Exclude<CaveDigOutcome, "dug" | "moved">,
  target?: CavePosition,
  targetHardness?: number,
): CaveDigResult {
  return {
    ok: false,
    state,
    outcome,
    target,
    targetHardness,
    fuelConsumed: 0,
    rockBreakingPower: 0,
  };
}

export function digCave(state: GameState, direction: DigDirection): CaveDigResult {
  const miningState = state.caveMining;
  const target = getTargetPosition(miningState.position, direction);
  if (!target) return getFailureResult(state, "boundary");
  const targetCell = getCaveCell(target);
  if (!targetCell) return getFailureResult(state, "boundary", target);
  if (isCaveCellExcavated(miningState, target)) {
    return {
      ok: true,
      state: {
        ...state,
        caveMining: {
          ...miningState,
          position: { ...target },
        },
      },
      outcome: "moved",
      target,
      targetHardness: targetCell.hardness,
      fuelConsumed: 0,
      rockBreakingPower: 0,
    };
  }
  if (miningState.fuel < 1) return getFailureResult(state, "no-fuel", target, targetCell.hardness);
  if (getMiningInventoryTotal(state.miningInventory) >= getMiningCapacity(miningState)) {
    return getFailureResult(state, "capacity-full", target, targetCell.hardness);
  }
  if (getDrillHardness(miningState) < targetCell.hardness) {
    return getFailureResult(state, "too-hard", target, targetCell.hardness);
  }

  const nextInventory = normalizeMiningInventory(state.miningInventory);
  if (targetCell.resourceType) nextInventory[targetCell.resourceType] += 1;
  const nextMiningState: CaveMiningState = {
    ...miningState,
    fuel: miningState.fuel - 1,
    position: { ...target },
    excavatedCells: [...miningState.excavatedCells, getCaveCellKey(target)],
  };
  return {
    ok: true,
    state: {
      ...state,
      miningInventory: nextInventory,
      caveMining: nextMiningState,
    },
    outcome: "dug",
    target,
    targetHardness: targetCell.hardness,
    resourceType: targetCell.resourceType ?? undefined,
    fuelConsumed: 1,
    rockBreakingPower: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
  };
}

function upgradeState(
  state: GameState,
  kind: CaveUpgradeKind,
): GameState {
  const caveMining = kind === "drill"
    ? { ...state.caveMining, drillLevel: state.caveMining.drillLevel + 1 }
    : kind === "fuel-tank"
      ? { ...state.caveMining, fuelTankLevel: state.caveMining.fuelTankLevel + 1 }
      : { ...state.caveMining, miningCapacityLevel: state.caveMining.miningCapacityLevel + 1 };
  return { ...state, caveMining };
}

export function upgradeCave(
  state: GameState,
  kind: CaveUpgradeKind,
): CaveUpgradeResult {
  const cost = getCaveUpgradeCost(state.caveMining, kind);
  if (!Number.isFinite(state.coins) || state.coins < cost) {
    return { ok: false, state, reason: "not-enough-coins" };
  }
  return {
    ok: true,
    state: upgradeState({ ...state, coins: state.coins - cost }, kind),
  };
}

export function purchaseCaveFuel(state: GameState): CaveFuelPurchaseResult {
  if (state.caveMining.fuel > 0) {
    return { ok: false, state, reason: "fuel-not-empty" };
  }
  if (!Number.isFinite(state.coins) || state.coins < CAVE_FUEL_PURCHASE_COST) {
    return { ok: false, state, reason: "not-enough-coins" };
  }
  const fuel = Math.min(
    getFuelTankCapacity(state.caveMining),
    CAVE_FUEL_PURCHASE_AMOUNT,
  );
  return {
    ok: true,
    state: {
      ...state,
      coins: state.coins - CAVE_FUEL_PURCHASE_COST,
      caveMining: {
        ...state.caveMining,
        fuel,
      },
    },
  };
}
