import { getBuildingDefinition } from "../data/buildings";
import type { BuildingUpgradeCost, BuildingUpgradeFailureReason, BuildingUpgradeLevels, BuildingUpgradeResult, BuildingUpgradeState, BuildingUpgradeType } from "../types/BuildingUpgrade";
import {
  BUILDING_UPGRADE_MAX_LEVEL,
  BUILDING_UPGRADE_TYPES,
} from "../types/BuildingUpgrade";
import type { BuildingInstance } from "../types/Building";
import type { MiningResourceType } from "../types/Mining";
import type { GameState } from "../types/Village";

export const BUILDING_UPGRADE_SPEED_MULTIPLIERS: readonly number[] = [1, 0.85, 0.70, 0.55];
export const BUILDING_UPGRADE_BASE_QUEUE_CAPACITY = 3;

export interface BuildingUpgradeAvailability {
  level: number;
  nextLevel: number;
  cost: BuildingUpgradeCost | null;
  canUpgrade: boolean;
  reason?: BuildingUpgradeFailureReason;
}

const FACTORY_BUILDING_IDS = new Set([
  "milk-factory",
  "pork-factory",
  "wheat-factory",
]);

const UPGRADE_LEVEL_COSTS: readonly BuildingUpgradeCost[] = [
  {},
  { copper: 4 },
  { iron: 3, crystal: 2 },
  { gold: 2, diamond: 1 },
];

const UPGRADE_TYPE_SET = new Set<string>(BUILDING_UPGRADE_TYPES);

function isBuildingUpgradeType(value: unknown): value is BuildingUpgradeType {
  return typeof value === "string" && UPGRADE_TYPE_SET.has(value);
}

function isFactoryBuildingId(buildingId: string): boolean {
  return FACTORY_BUILDING_IDS.has(buildingId);
}

function isShopBuildingId(buildingId: string): boolean {
  return getBuildingDefinition(buildingId)?.visitorService !== undefined;
}

/** Return the upgrade tracks that are meaningful for a building kind. */
export function getSupportedBuildingUpgradeTypes(
  buildingId: string,
): readonly BuildingUpgradeType[] {
  if (isFactoryBuildingId(buildingId)) return ["production-speed"];
  if (isShopBuildingId(buildingId)) return ["sale-speed", "queue-capacity"];
  return [];
}

function isSupportedBuildingUpgrade(
  buildingId: string,
  upgradeType: BuildingUpgradeType,
): boolean {
  return getSupportedBuildingUpgradeTypes(buildingId).includes(upgradeType);
}

function clampLevel(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(BUILDING_UPGRADE_MAX_LEVEL, Math.max(0, Math.floor(value)));
}

function getBuildingById(
  buildings: readonly BuildingInstance[],
  instanceId: string,
): BuildingInstance | undefined {
  const matches = buildings.filter((building) => building.id === instanceId);
  return matches.length === 1 ? matches[0] : undefined;
}

function getStateEntries(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

function getLevelEntries(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

/**
 * Canonicalize upgrade data at the SaveSystem seam.  Unknown instance ids,
 * unsupported tracks, malformed levels, and zero-only records are discarded.
 */
export function normalizeBuildingUpgrades(
  value: unknown,
  buildings: readonly BuildingInstance[],
): BuildingUpgradeState {
  const source = getStateEntries(value);
  const buildingsById = new Map<string, BuildingInstance>();
  for (const building of buildings) {
    if (!buildingsById.has(building.id)) buildingsById.set(building.id, building);
  }

  const normalized: BuildingUpgradeState = {};
  for (const [instanceId, rawLevels] of Object.entries(source)) {
    const building = buildingsById.get(instanceId);
    if (!building) continue;
    const levelEntries = getLevelEntries(rawLevels);
    const levels: BuildingUpgradeLevels = {};
    for (const upgradeType of getSupportedBuildingUpgradeTypes(building.buildingId)) {
      const level = clampLevel(levelEntries[upgradeType]);
      if (level > 0) levels[upgradeType] = level;
    }
    if (Object.keys(levels).length > 0) normalized[instanceId] = levels;
  }
  return normalized;
}

export function createInitialBuildingUpgrades(): BuildingUpgradeState {
  return {};
}

export function getBuildingUpgradeLevel(
  state: Pick<GameState, "buildingUpgrades">,
  instanceId: string,
  upgradeType: BuildingUpgradeType,
): number {
  if (!isBuildingUpgradeType(upgradeType)) return 0;
  return clampLevel(state.buildingUpgrades?.[instanceId]?.[upgradeType]);
}

export function getBuildingUpgradeCost(
  upgradeType: BuildingUpgradeType,
  nextLevel: number,
): BuildingUpgradeCost | null {
  if (!isBuildingUpgradeType(upgradeType)) return null;
  if (!Number.isInteger(nextLevel) || nextLevel < 1 || nextLevel > BUILDING_UPGRADE_MAX_LEVEL) {
    return null;
  }
  return UPGRADE_LEVEL_COSTS[nextLevel] ?? null;
}

export function getBuildingUpgradeMultiplier(
  state: Pick<GameState, "buildingUpgrades">,
  instanceId: string,
  upgradeType: "production-speed" | "sale-speed",
): number {
  const level = getBuildingUpgradeLevel(state, instanceId, upgradeType);
  return BUILDING_UPGRADE_SPEED_MULTIPLIERS[level] ?? 1;
}

export function getBuildingUpgradeQueueCapacity(
  state: Pick<GameState, "buildingUpgrades">,
  instanceId: string,
  baseCapacity = BUILDING_UPGRADE_BASE_QUEUE_CAPACITY,
): number {
  const safeBaseCapacity = Number.isFinite(baseCapacity)
    ? Math.max(0, Math.floor(baseCapacity))
    : BUILDING_UPGRADE_BASE_QUEUE_CAPACITY;
  return safeBaseCapacity + getBuildingUpgradeLevel(state, instanceId, "queue-capacity");
}

/** Alias that reads naturally at the shop/factory call site. */
export const getBuildingQueueCapacity = getBuildingUpgradeQueueCapacity;

export function getBuildingUpgradeServiceDuration(
  state: Pick<GameState, "buildingUpgrades">,
  instanceId: string,
  baseDurationMs: number,
): number {
  const safeBaseDuration = Number.isFinite(baseDurationMs)
    ? Math.max(0, baseDurationMs)
    : 0;
  return safeBaseDuration * getBuildingUpgradeMultiplier(state, instanceId, "sale-speed");
}

export function getBuildingProductionInterval(
  state: Pick<GameState, "buildingUpgrades">,
  instanceId: string,
  baseIntervalMs: number,
): number {
  const safeBaseInterval = Number.isFinite(baseIntervalMs)
    ? Math.max(0, baseIntervalMs)
    : 0;
  return safeBaseInterval * getBuildingUpgradeMultiplier(state, instanceId, "production-speed");
}

function hasEnoughResources(
  inventory: GameState["miningInventory"],
  cost: BuildingUpgradeCost,
): boolean {
  return (Object.entries(cost) as Array<[MiningResourceType, number]>).every(([resourceType, amount]) =>
    inventory[resourceType] >= amount,
  );
}

/**
 * Read the same upgrade rules used by the purchase command without mutating
 * state. UI callers can use this query to render disabled controls while the
 * purchase path remains the only place that changes resources.
 */
export function getBuildingUpgradeAvailability(
  state: GameState,
  instanceId: string,
  upgradeType: BuildingUpgradeType,
): BuildingUpgradeAvailability {
  const building = getBuildingById(state.buildings, instanceId);
  if (!building) {
    return { level: 0, nextLevel: 1, cost: null, canUpgrade: false, reason: "not-found" };
  }
  if (!isBuildingUpgradeType(upgradeType) ||
      !isSupportedBuildingUpgrade(building.buildingId, upgradeType)) {
    return { level: 0, nextLevel: 1, cost: null, canUpgrade: false, reason: "unsupported-type" };
  }

  const level = getBuildingUpgradeLevel(state, instanceId, upgradeType);
  const nextLevel = level + 1;
  if (nextLevel > BUILDING_UPGRADE_MAX_LEVEL) {
    return { level, nextLevel, cost: null, canUpgrade: false, reason: "max-level" };
  }
  const cost = getBuildingUpgradeCost(upgradeType, nextLevel);
  if (!cost || !hasEnoughResources(state.miningInventory, cost)) {
    return { level, nextLevel, cost, canUpgrade: false, reason: "not-enough-resources" };
  }
  return { level, nextLevel, cost, canUpgrade: true };
}

function consumeResources(
  inventory: GameState["miningInventory"],
  cost: BuildingUpgradeCost,
): GameState["miningInventory"] {
  const nextInventory = { ...inventory };
  for (const [resourceType, amount] of Object.entries(cost) as Array<[
    MiningResourceType,
    number,
  ]>) {
    nextInventory[resourceType] -= amount;
  }
  return nextInventory;
}

function failedUpgrade(
  state: GameState,
  reason: BuildingUpgradeFailureReason,
): BuildingUpgradeResult {
  return { success: false, state, reason };
}

/**
 * Atomically buy the next level for a concrete building instance.  The
 * resource check happens before any copy is made, so a failed purchase cannot
 * partially consume mining materials.
 */
export function upgradeBuilding(
  state: GameState,
  instanceId: string,
  upgradeType: BuildingUpgradeType,
): BuildingUpgradeResult {
  const availability = getBuildingUpgradeAvailability(state, instanceId, upgradeType);
  if (!availability.canUpgrade || !availability.cost) {
    return failedUpgrade(state, availability.reason ?? "not-enough-resources");
  }

  const cost = availability.cost;
  const nextLevel = availability.nextLevel;

  const currentLevels = state.buildingUpgrades?.[instanceId] ?? {};
  const nextLevels: BuildingUpgradeLevels = {
    ...currentLevels,
    [upgradeType]: nextLevel,
  };
  const nextBuildingUpgrades: BuildingUpgradeState = {
    ...(state.buildingUpgrades ?? {}),
    [instanceId]: nextLevels,
  };
  return {
    success: true,
    level: nextLevel,
    cost,
    state: {
      ...state,
      miningInventory: consumeResources(state.miningInventory, cost),
      buildingUpgrades: nextBuildingUpgrades,
    },
  };
}

/** Remove all upgrade data for a building that is being dismantled. */
export function removeBuildingUpgrades(
  state: GameState,
  instanceId: string,
): GameState {
  if (!state.buildingUpgrades || !Object.prototype.hasOwnProperty.call(state.buildingUpgrades, instanceId)) {
    return state;
  }
  const { [instanceId]: _removed, ...remaining } = state.buildingUpgrades;
  return { ...state, buildingUpgrades: remaining };
}

export const removeBuildingUpgrade = removeBuildingUpgrades;
