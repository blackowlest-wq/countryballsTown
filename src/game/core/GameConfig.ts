import {
  COIN_INTERVAL_MS,
  COINS_PER_INTERVAL,
  GRID_SIZE,
  RESIDENT_ACTION_MS,
  RESIDENT_DECISION_MAX_MS,
  RESIDENT_DECISION_MIN_MS,
  RESIDENT_WALK_SPEED,
} from "../constants/gameConstants";

export const gameConfig = {
  gridSize: GRID_SIZE,
  coinIntervalMs: COIN_INTERVAL_MS,
  coinsPerInterval: COINS_PER_INTERVAL,
  residentWalkSpeed: RESIDENT_WALK_SPEED,
  residentActionMs: RESIDENT_ACTION_MS,
  residentDecisionMinMs: RESIDENT_DECISION_MIN_MS,
  residentDecisionMaxMs: RESIDENT_DECISION_MAX_MS,
} as const;
