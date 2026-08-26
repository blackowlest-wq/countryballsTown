import {
  RESIDENT_REQUEST_COOLDOWN_MAX_MS,
  RESIDENT_REQUEST_COOLDOWN_MIN_MS,
  RESIDENT_REQUEST_DAILY_LIMIT,
  RESIDENT_REQUEST_RETRY_DELAY_MS,
} from "../constants/gameConstants";
import {
  getResidentRequestDefinition,
  residentRequestDefinitions,
} from "../data/residentRequests";
import { getCountryDefinition } from "../data/countries";
import type { ResidentRequestDefinition } from "../types/ResidentRequest";
import type { GameState } from "../types/Village";
import { formatCoinAmount } from "../../utils/coinFormatting";
import { getLocalDateKey } from "../../utils/date";
import { celebrateResident } from "./ResidentSystem";
import { creditCoins } from "./EconomySystem";

export type ResidentRequestProgressSource =
  | { type: "building-placed"; buildingId: string }
  | { type: "coins-earned"; amount: number };

export type ResidentRequestEvent =
  | { type: "started"; definitionId: string; residentId: string }
  | {
      type: "completed";
      definitionId: string;
      residentId: string;
      rewardCoins: number;
    };

export interface ResidentRequestResult {
  state: GameState;
  event?: ResidentRequestEvent;
}

export type RequestRandomSource = () => number;

function randomCooldown(random: RequestRandomSource): number {
  return (
    RESIDENT_REQUEST_COOLDOWN_MIN_MS +
    (RESIDENT_REQUEST_COOLDOWN_MAX_MS - RESIDENT_REQUEST_COOLDOWN_MIN_MS) * random()
  );
}

function isDefinitionEligible(
  state: GameState,
  definition: ResidentRequestDefinition,
): boolean {
  if (!state.residents.some((resident) => resident.countryId === definition.countryId)) {
    return false;
  }
  if (definition.goal.type === "earn-coins") return true;
  const hasUnlockedBuilding = definition.goal.buildingIds.some((buildingId) =>
    state.unlockedBuildings.includes(buildingId),
  );
  return hasUnlockedBuilding && buildingGoalProgress(state, definition) < definition.goal.target;
}

function buildingGoalProgress(
  state: GameState,
  definition: ResidentRequestDefinition,
): number {
  const goal = definition.goal;
  if (goal.type !== "building-count") return 0;
  return Math.min(
    goal.target,
    state.buildings.filter((building) => goal.buildingIds.includes(building.buildingId)).length,
  );
}

export function getEligibleResidentRequests(state: GameState): ResidentRequestDefinition[] {
  return residentRequestDefinitions.filter((definition) =>
    isDefinitionEligible(state, definition),
  );
}

function requestIsValid(state: GameState): boolean {
  const active = state.activeResidentRequest;
  if (!active) return true;
  const definition = getResidentRequestDefinition(active.definitionId);
  return Boolean(
    definition &&
      state.residents.some(
        (resident) =>
          resident.id === active.residentId && resident.countryId === definition.countryId,
      ),
  );
}

function withoutInvalidRequest(state: GameState, now: number): GameState {
  if (requestIsValid(state)) return state;
  return {
    ...state,
    activeResidentRequest: null,
    nextResidentRequestAt: now + RESIDENT_REQUEST_RETRY_DELAY_MS,
  };
}

function withCurrentRequestDay(state: GameState, now: number): GameState {
  const dayKey = getLocalDateKey(now);
  if (state.residentRequestDayKey === dayKey) return state;
  return {
    ...state,
    residentRequestDayKey: dayKey,
    residentRequestsStartedToday: 0,
  };
}

export function maybeStartResidentRequest(
  originalState: GameState,
  now: number,
  random: RequestRandomSource = Math.random,
): ResidentRequestResult {
  const state = withCurrentRequestDay(withoutInvalidRequest(originalState, now), now);
  if (
    state.activeResidentRequest ||
    now < state.nextResidentRequestAt ||
    state.residentRequestsStartedToday >= RESIDENT_REQUEST_DAILY_LIMIT
  ) {
    return { state };
  }

  const eligible = getEligibleResidentRequests(state);
  const withoutLast = eligible.filter(
    (definition) => definition.id !== state.lastResidentRequestDefinitionId,
  );
  const candidates = withoutLast.length > 0 ? withoutLast : eligible;
  if (candidates.length === 0) {
    return {
      state: {
        ...state,
        nextResidentRequestAt: now + RESIDENT_REQUEST_RETRY_DELAY_MS,
      },
    };
  }

  const roll = Math.max(0, Math.min(0.999_999, random()));
  const definition = candidates[Math.floor(roll * candidates.length)];
  const resident = state.residents.find(
    (candidate) => candidate.countryId === definition.countryId,
  );
  if (!resident) return { state };

  return {
    state: {
      ...state,
      activeResidentRequest: {
        definitionId: definition.id,
        residentId: resident.id,
        progress: buildingGoalProgress(state, definition),
        startedAt: now,
      },
      residentRequestsStartedToday: state.residentRequestsStartedToday + 1,
    },
    event: {
      type: "started",
      definitionId: definition.id,
      residentId: resident.id,
    },
  };
}

function updatedProgress(
  state: GameState,
  definition: ResidentRequestDefinition,
  currentProgress: number,
  source: ResidentRequestProgressSource,
): number {
  if (definition.goal.type === "building-count") {
    return buildingGoalProgress(state, definition);
  }
  const increment = source.type === "coins-earned" ? Math.max(0, source.amount) : 0;
  return Math.min(definition.goal.target, currentProgress + increment);
}

export function advanceResidentRequest(
  originalState: GameState,
  source: ResidentRequestProgressSource,
  now: number,
  random: RequestRandomSource = Math.random,
): ResidentRequestResult {
  const state = withCurrentRequestDay(withoutInvalidRequest(originalState, now), now);
  const active = state.activeResidentRequest;
  if (!active) return { state };

  const definition = getResidentRequestDefinition(active.definitionId);
  if (!definition) return { state };
  const progress = updatedProgress(state, definition, active.progress, source);
  if (progress === active.progress && progress < definition.goal.target) return { state };
  if (progress < definition.goal.target) {
    return {
      state: {
        ...state,
        activeResidentRequest: { ...active, progress },
      },
    };
  }

  const reward = creditCoins(state, definition.rewardCoins);
  const rewardedState: GameState = {
    ...reward.state,
    activeResidentRequest: null,
    lastResidentRequestDefinitionId: definition.id,
    nextResidentRequestAt: now + randomCooldown(random),
  };
  return {
    state: celebrateResident(rewardedState, active.residentId, now),
    event: {
      type: "completed",
      definitionId: definition.id,
      residentId: active.residentId,
      rewardCoins: reward.coinsEarned,
    },
  };
}

export function describeResidentRequestEvent(event: ResidentRequestEvent): string {
  const definition = getResidentRequestDefinition(event.definitionId);
  const country = definition ? getCountryDefinition(definition.countryId) : undefined;
  const speaker = `${country?.flagEmoji ?? "💬"} ${country?.name ?? "住民"}`;
  if (event.type === "started") return `${speaker}からお願いが届きました！`;
  return `${speaker}のお願い達成！ コイン +${formatCoinAmount(event.rewardCoins)}`;
}
