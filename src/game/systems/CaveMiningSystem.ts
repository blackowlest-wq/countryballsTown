import {
  CAVE_CELL_BASE_DURABILITY,
  CAVE_CELL_DURABILITY_PER_DEPTH,
  CAVE_CELL_DURABILITY_PER_HARDNESS,
  CAVE_DRILL_HARDNESS_PER_LEVEL,
  CAVE_FUEL_PURCHASE_COST,
  CAVE_FUEL_TANK_CAPACITY_PER_LEVEL,
  CAVE_INITIAL_DRILL_HARDNESS,
  CAVE_INITIAL_FUEL,
  CAVE_INITIAL_FUEL_TANK_CAPACITY,
  CAVE_INITIAL_MINING_CAPACITY,
  CAVE_MAX_FUEL_TANK_LEVEL,
  CAVE_MAX_DRILL_HARDNESS,
  CAVE_MAX_DRILL_LEVEL,
  CAVE_MAX_DEPTH,
  CAVE_MAX_MINING_CAPACITY_LEVEL,
  CAVE_MINING_CAPACITY_PER_LEVEL,
  CAVE_RESOURCE_REVEAL_RADIUS,
  CAVE_ROCK_BREAKING_POWER_PER_FUEL,
  CAVE_UPGRADE_BASE_COST,
  CAVE_WIDTH,
} from "../constants/gameConstants";
import {
  createInitialMiningInventory,
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

export const CAVE_DEFAULT_LAYOUT_SEED = 0x51a7c0de;
export const CAVE_START_POSITION: CavePosition = { x: Math.floor(CAVE_WIDTH / 2), depth: 0 };

interface CaveLayoutCell {
  hardness?: number;
  resourceType?: MiningResourceType;
}

export interface CaveCell {
  position: CavePosition;
  hardness: number;
  durability: number;
  resourceType: MiningResourceType | null;
}

const defaultCaveLayout: Readonly<Record<string, CaveLayoutCell>> = {
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

const randomResourceTypes: readonly MiningResourceType[] = [
  "copper",
  "iron",
  "gold",
  "diamond",
  "fossil",
  "crystal",
  "amber",
  "ancient-relic",
  "glowing-mushroom",
];

const guaranteedResourcePools: Readonly<Record<string, readonly MiningResourceType[]>> = {
  "2:0": ["copper", "iron", "crystal"],
  "4:0": ["fossil", "copper", "glowing-mushroom"],
  "3:1": ["iron", "fossil", "crystal"],
  "2:1": ["glowing-mushroom", "crystal", "fossil"],
  "4:1": ["crystal", "iron", "amber"],
  "3:5": ["gold", "amber", "diamond"],
};

export type CaveDigOutcome =
  | "damaged"
  | "dug"
  | "moved"
  | "no-fuel"
  | "capacity-full"
  | "boundary";

export interface CaveDigResult {
  ok: boolean;
  state: GameState;
  outcome: CaveDigOutcome;
  target?: CavePosition;
  targetHardness?: number;
  cellDurability?: number;
  cellDamage?: number;
  damageDealt: number;
  isCracked: boolean;
  resourceType?: MiningResourceType;
  fuelConsumed: number;
  /** Maximum breaking power represented by one fuel. */
  rockBreakingPower: number;
}

export type CaveUpgradeKind = "drill" | "fuel-tank" | "mining-capacity";
export type CaveUpgradeFailureReason = "not-enough-coins" | "max-level";

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

export function createInitialCaveMiningState(
  layoutSeed = CAVE_DEFAULT_LAYOUT_SEED,
): CaveMiningState {
  return {
    fuel: CAVE_INITIAL_FUEL,
    fuelTankLevel: 0,
    drillLevel: 0,
    miningCapacityLevel: 0,
    carriedInventory: createInitialMiningInventory(),
    layoutSeed,
    position: { ...CAVE_START_POSITION },
    excavatedCells: [getCaveCellKey(CAVE_START_POSITION)],
    cellDamage: {},
  };
}

function asSeed(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? (Math.max(0, Math.floor(value)) >>> 0)
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

function getCellRandom(seed: number, position: CavePosition, salt: number): number {
  let value = (
    seed ^
    Math.imul(position.x + 1, 0x9e3779b1) ^
    Math.imul(position.depth + 1, 0x85ebca77) ^
    Math.imul(salt + 1, 0xc2b2ae3d)
  ) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 0x1_0000_0000;
}

function getRandomLayoutCell(position: CavePosition, layoutSeed: number): CaveLayoutCell {
  if (getCaveCellKey(position) === getCaveCellKey(CAVE_START_POSITION)) return {};

  const guaranteedPool = guaranteedResourcePools[getCaveCellKey(position)];
  if (guaranteedPool) {
    const resourceType = guaranteedPool[
      Math.floor(getCellRandom(layoutSeed, position, 1) * guaranteedPool.length)
    ];
    return { resourceType };
  }

  const resourceChance = 0.08 + Math.min(0.1, position.depth / CAVE_MAX_DEPTH * 0.1);
  if (getCellRandom(layoutSeed, position, 2) >= resourceChance) return {};
  return {
    resourceType: randomResourceTypes[
      Math.floor(getCellRandom(layoutSeed, position, 3) * randomResourceTypes.length)
    ],
  };
}

function getLayoutCell(position: CavePosition, layoutSeed: number): CaveLayoutCell | undefined {
  if (layoutSeed === CAVE_DEFAULT_LAYOUT_SEED) return defaultCaveLayout[getCaveCellKey(position)];
  return getRandomLayoutCell(position, layoutSeed);
}

function getTerrainHardness(position: CavePosition, layoutSeed: number): number {
  const depthHardness = Math.min(6, 1 + Math.floor(position.depth / 2));
  if (layoutSeed === CAVE_DEFAULT_LAYOUT_SEED) return depthHardness;
  return Math.min(
    6,
    depthHardness + (getCellRandom(layoutSeed, position, 4) >= 0.78 ? 1 : 0),
  );
}

function getCellDurability(depth: number, hardness: number): number {
  return CAVE_CELL_BASE_DURABILITY
    + depth * CAVE_CELL_DURABILITY_PER_DEPTH
    + hardness * CAVE_CELL_DURABILITY_PER_HARDNESS;
}

export function getCaveCell(position: CavePosition, layoutSeed = CAVE_DEFAULT_LAYOUT_SEED): CaveCell | null {
  if (!isCavePosition(position)) return null;
  const layoutCell = getLayoutCell(position, layoutSeed);
  const resourceType = layoutCell?.resourceType ?? null;
  const resourceHardness = resourceType
    ? getMiningResourceDefinition(resourceType).hardness
    : 0;
  const hardness = Math.min(
    6,
    layoutCell?.hardness ?? Math.max(getTerrainHardness(position, layoutSeed), resourceHardness),
  );
  return {
    position: { ...position },
    hardness,
    durability: getCellDurability(position.depth, hardness),
    resourceType,
  };
}

export function getCaveCellDamage(
  state: Pick<CaveMiningState, "cellDamage" | "layoutSeed">,
  position: CavePosition,
): number {
  const cell = getCaveCell(position, state.layoutSeed);
  if (!cell) return 0;
  return Math.min(cell.durability, Math.max(0, state.cellDamage[getCaveCellKey(position)] ?? 0));
}

export function getCaveCellDamageRatio(
  state: Pick<CaveMiningState, "cellDamage" | "layoutSeed">,
  position: CavePosition,
): number {
  const cell = getCaveCell(position, state.layoutSeed);
  return cell ? getCaveCellDamage(state, position) / cell.durability : 0;
}

export function isCaveCellExcavated(state: CaveMiningState, position: CavePosition): boolean {
  return state.excavatedCells.includes(getCaveCellKey(position));
}

export function isCaveCellCracked(state: CaveMiningState, position: CavePosition): boolean {
  return !isCaveCellExcavated(state, position)
    && getCaveCellDamageRatio(state, position) >= 0.5;
}

function isWithinResourceRevealRadius(source: CavePosition, target: CavePosition): boolean {
  return Math.max(
    Math.abs(source.x - target.x),
    Math.abs(source.depth - target.depth),
  ) <= CAVE_RESOURCE_REVEAL_RADIUS;
}

export function isCaveResourceRevealed(state: CaveMiningState, position: CavePosition): boolean {
  return state.excavatedCells.some((cellKey) => {
    const excavatedPosition = parseCaveCellKey(cellKey);
    return excavatedPosition !== null && isWithinResourceRevealRadius(excavatedPosition, position);
  });
}

export function getRevealedCaveResourceType(
  state: CaveMiningState,
  position: CavePosition,
): MiningResourceType | null {
  const cell = getCaveCell(position, state.layoutSeed);
  return cell?.resourceType && isCaveResourceRevealed(state, position)
    ? cell.resourceType
    : null;
}

export function getFuelTankCapacity(
  state: Pick<CaveMiningState, "fuelTankLevel">,
): number {
  return CAVE_INITIAL_FUEL_TANK_CAPACITY
    + Math.min(CAVE_MAX_FUEL_TANK_LEVEL, state.fuelTankLevel)
      * CAVE_FUEL_TANK_CAPACITY_PER_LEVEL;
}

export function getDrillHardness(
  state: Pick<CaveMiningState, "drillLevel">,
): number {
  return Math.min(
    CAVE_MAX_DRILL_HARDNESS,
    CAVE_INITIAL_DRILL_HARDNESS + state.drillLevel * CAVE_DRILL_HARDNESS_PER_LEVEL,
  );
}

export function isCaveUpgradeMaxed(
  state: Pick<CaveMiningState, "drillLevel" | "fuelTankLevel" | "miningCapacityLevel">,
  kind: CaveUpgradeKind,
): boolean {
  if (kind === "drill") return getDrillHardness(state) >= CAVE_MAX_DRILL_HARDNESS;
  if (kind === "fuel-tank") return state.fuelTankLevel >= CAVE_MAX_FUEL_TANK_LEVEL;
  return state.miningCapacityLevel >= CAVE_MAX_MINING_CAPACITY_LEVEL;
}

export function getMiningCapacity(
  state: Pick<CaveMiningState, "miningCapacityLevel">,
): number {
  return CAVE_INITIAL_MINING_CAPACITY
    + Math.min(CAVE_MAX_MINING_CAPACITY_LEVEL, state.miningCapacityLevel)
      * CAVE_MINING_CAPACITY_PER_LEVEL;
}

export function getMiningInventoryTotal(inventory: MiningInventory): number {
  return Object.values(normalizeMiningInventory(inventory))
    .reduce((total, amount) => total + amount, 0);
}

/** Ends the active mining session without changing the accumulated materials. */
export function finishCaveMiningSession(state: GameState): GameState {
  return {
    ...state,
    caveMining: {
      ...state.caveMining,
      carriedInventory: createInitialMiningInventory(),
    },
  };
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

export function getCaveDigDamage(drillHardness: number, targetHardness: number): number {
  const efficiency = Math.min(1, Math.max(0, drillHardness / Math.max(1, targetHardness)));
  return Math.max(1, Math.floor(CAVE_ROCK_BREAKING_POWER_PER_FUEL * efficiency));
}

export function normalizeCaveMiningState(value: unknown): CaveMiningState {
  const initial = createInitialCaveMiningState();
  const candidate = value && typeof value === "object"
    ? value as Partial<CaveMiningState>
    : {};
  const fuelTankLevel = clampInteger(
    candidate.fuelTankLevel,
    0,
    CAVE_MAX_FUEL_TANK_LEVEL,
    initial.fuelTankLevel,
  );
  const drillLevel = clampInteger(
    candidate.drillLevel,
    0,
    CAVE_MAX_DRILL_LEVEL,
    initial.drillLevel,
  );
  const miningCapacityLevel = clampInteger(
    candidate.miningCapacityLevel,
    0,
    CAVE_MAX_MINING_CAPACITY_LEVEL,
    initial.miningCapacityLevel,
  );
  const layoutSeed = asSeed(candidate.layoutSeed, initial.layoutSeed);
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
  const excavatedSet = new Set(uniqueExcavatedCells);
  const cellDamage: Record<string, number> = {};
  if (candidate.cellDamage && typeof candidate.cellDamage === "object") {
    for (const [cellKey, rawDamage] of Object.entries(candidate.cellDamage)) {
      const cellPosition = parseCaveCellKey(cellKey);
      if (!cellPosition || excavatedSet.has(getCaveCellKey(cellPosition))) continue;
      const cell = getCaveCell(cellPosition, layoutSeed);
      const damage = clampInteger(rawDamage, 0, Math.max(0, (cell?.durability ?? 1) - 1), 0);
      if (damage > 0) cellDamage[getCaveCellKey(cellPosition)] = damage;
    }
  }
  return {
    fuel: clampInteger(candidate.fuel, 0, fuelTankCapacity, Math.min(initial.fuel, fuelTankCapacity)),
    fuelTankLevel,
    drillLevel,
    miningCapacityLevel,
    carriedInventory: normalizeMiningInventory(candidate.carriedInventory),
    layoutSeed,
    position,
    excavatedCells: uniqueExcavatedCells,
    cellDamage,
  };
}

export function createCaveLayoutSeed(
  random: () => number = Math.random,
  previousSeed?: number,
): number {
  const sampled = random();
  const normalized = Number.isFinite(sampled)
    ? Math.max(0, Math.min(0.999999999, sampled))
    : 0.5;
  let seed = Math.floor(normalized * 0x1_0000_0000) >>> 0;
  if (seed === CAVE_DEFAULT_LAYOUT_SEED || seed === previousSeed) seed = (seed + 1) >>> 0;
  return seed;
}

export function resetCaveMining(state: GameState, random: () => number = Math.random): GameState {
  return {
    ...state,
    caveMining: {
      ...state.caveMining,
      carriedInventory: createInitialMiningInventory(),
      layoutSeed: createCaveLayoutSeed(random, state.caveMining.layoutSeed),
      position: { ...CAVE_START_POSITION },
      excavatedCells: [getCaveCellKey(CAVE_START_POSITION)],
      cellDamage: {},
    },
  };
}

export function getTargetPosition(
  position: CavePosition,
  direction: DigDirection,
): CavePosition | null {
  const target = direction === "left"
    ? { x: position.x - 1, depth: position.depth }
    : direction === "right"
      ? { x: position.x + 1, depth: position.depth }
      : direction === "up"
        ? { x: position.x, depth: position.depth - 1 }
        : { x: position.x, depth: position.depth + 1 };
  return isCavePosition(target) ? target : null;
}

function getFailureResult(
  state: GameState,
  outcome: Exclude<CaveDigOutcome, "damaged" | "dug" | "moved">,
  target?: CavePosition,
  targetCell?: CaveCell | null,
): CaveDigResult {
  return {
    ok: false,
    state,
    outcome,
    target,
    targetHardness: targetCell?.hardness,
    cellDurability: targetCell?.durability,
    cellDamage: target ? getCaveCellDamage(state.caveMining, target) : undefined,
    damageDealt: 0,
    isCracked: target ? isCaveCellCracked(state.caveMining, target) : false,
    fuelConsumed: 0,
    rockBreakingPower: 0,
  };
}

export function digCave(state: GameState, direction: DigDirection): CaveDigResult {
  const miningState = state.caveMining;
  const target = getTargetPosition(miningState.position, direction);
  if (!target) return getFailureResult(state, "boundary");
  const targetCell = getCaveCell(target, miningState.layoutSeed);
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
      cellDurability: targetCell.durability,
      cellDamage: 0,
      damageDealt: 0,
      isCracked: false,
      fuelConsumed: 0,
      rockBreakingPower: 0,
    };
  }
  if (miningState.fuel < 1) {
    return getFailureResult(state, "no-fuel", target, targetCell);
  }
  const carriedInventory = normalizeMiningInventory(miningState.carriedInventory);
  if (getMiningInventoryTotal(carriedInventory) >= getMiningCapacity(miningState)) {
    return getFailureResult(state, "capacity-full", target, targetCell);
  }

  const cellKey = getCaveCellKey(target);
  const previousDamage = getCaveCellDamage(miningState, target);
  const damageDealt = getCaveDigDamage(getDrillHardness(miningState), targetCell.hardness);
  const cellDamage = Math.min(targetCell.durability, previousDamage + damageDealt);
  const isDug = cellDamage >= targetCell.durability;
  const nextCellDamage = { ...miningState.cellDamage };
  if (isDug) delete nextCellDamage[cellKey];
  else nextCellDamage[cellKey] = cellDamage;

  const nextInventory = normalizeMiningInventory(state.miningInventory);
  const nextCarriedInventory = normalizeMiningInventory(carriedInventory);
  if (isDug && targetCell.resourceType) {
    nextInventory[targetCell.resourceType] += 1;
    nextCarriedInventory[targetCell.resourceType] += 1;
  }
  const nextMiningState: CaveMiningState = {
    ...miningState,
    fuel: miningState.fuel - 1,
    position: isDug ? { ...target } : { ...miningState.position },
    excavatedCells: isDug
      ? [...miningState.excavatedCells, cellKey]
      : miningState.excavatedCells,
    cellDamage: nextCellDamage,
    carriedInventory: isDug && targetCell.resourceType
      ? nextCarriedInventory
      : miningState.carriedInventory,
  };
  return {
    ok: true,
    state: {
      ...state,
      miningInventory: isDug ? nextInventory : state.miningInventory,
      caveMining: nextMiningState,
    },
    outcome: isDug ? "dug" : "damaged",
    target,
    targetHardness: targetCell.hardness,
    cellDurability: targetCell.durability,
    cellDamage: isDug ? 0 : cellDamage,
    damageDealt,
    isCracked: cellDamage >= targetCell.durability / 2,
    resourceType: isDug ? targetCell.resourceType ?? undefined : undefined,
    fuelConsumed: 1,
    rockBreakingPower: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
  };
}

function upgradeState(
  state: GameState,
  kind: CaveUpgradeKind,
): GameState {
  const caveMining = kind === "drill"
    ? {
      ...state.caveMining,
      drillLevel: Math.min(CAVE_MAX_DRILL_LEVEL, state.caveMining.drillLevel + 1),
    }
    : kind === "fuel-tank"
      ? {
        ...state.caveMining,
        fuelTankLevel: Math.min(CAVE_MAX_FUEL_TANK_LEVEL, state.caveMining.fuelTankLevel + 1),
      }
      : {
        ...state.caveMining,
        miningCapacityLevel: Math.min(
          CAVE_MAX_MINING_CAPACITY_LEVEL,
          state.caveMining.miningCapacityLevel + 1,
        ),
      };
  return { ...state, caveMining };
}

export function upgradeCave(
  state: GameState,
  kind: CaveUpgradeKind,
): CaveUpgradeResult {
  if (isCaveUpgradeMaxed(state.caveMining, kind)) {
    return { ok: false, state, reason: "max-level" };
  }
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
  return {
    ok: true,
    state: {
      ...state,
      coins: state.coins - CAVE_FUEL_PURCHASE_COST,
      caveMining: {
        ...state.caveMining,
        fuel: getFuelTankCapacity(state.caveMining),
      },
    },
  };
}
