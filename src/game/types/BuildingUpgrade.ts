import type { MiningResourceCost } from "./Mining";

/** The upgrade tracks that can be attached to a single building instance. */
export type BuildingUpgradeType =
  | "production-speed"
  | "sale-speed"
  | "queue-capacity";

export const BUILDING_UPGRADE_TYPES: readonly BuildingUpgradeType[] = [
  "production-speed",
  "sale-speed",
  "queue-capacity",
];

export const BUILDING_UPGRADE_MAX_LEVEL = 3;

/**
 * Levels are intentionally keyed by the semantic upgrade type.  The record
 * is nested under a building instance id in GameState so multiple copies of
 * the same building can be upgraded independently.
 */
export type BuildingUpgradeLevels = Partial<Record<BuildingUpgradeType, number>>;
export type BuildingUpgradeState = Record<string, BuildingUpgradeLevels>;

export type BuildingUpgradeCost = MiningResourceCost;

export type BuildingUpgradeFailureReason =
  | "not-found"
  | "unsupported-type"
  | "max-level"
  | "not-enough-resources";

export interface BuildingUpgradeResult {
  success: boolean;
  state: import("./Village").GameState;
  reason?: BuildingUpgradeFailureReason;
  level?: number;
  cost?: BuildingUpgradeCost;
}
