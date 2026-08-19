import {
  RESIDENT_REQUEST_COOLDOWN_MAX_MS,
  RESIDENT_REQUEST_COOLDOWN_MIN_MS,
  RESIDENT_REQUEST_RETRY_DELAY_MS,
} from "../constants/gameConstants";
import {
  getResidentRequestDefinition,
  residentRequestDefinitions,
} from "../data/residentRequests";
import { getCountryDefinition } from "../data/countries";
import type { ResidentRequestDefinition } from "../types/ResidentRequest";
import type { GameState } from "../types/Village";
import { celebrateResident } from "./ResidentSystem";

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
  return definition.goal.buildingIds.some((buildingId) =>
    state.unlockedBuildings.includes(buildingId),
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

export function maybeStartResidentRequest(
  originalState: GameState,
  now: number,
  random: RequestRandomSource = Math.random,
): ResidentRequestResult {
  const state = withoutInvalidRequest(originalState, now);
  if (state.activeResidentRequest || now < state.nextResidentRequestAt) {
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
        progress: 0,
        startedAt: now,
      },
    },
    event: {
      type: "started",
      definitionId: definition.id,
      residentId: resident.id,
    },
  };
}

function progressIncrement(
  definition: ResidentRequestDefinition,
  source: ResidentRequestProgressSource,
): number {
  if (definition.goal.type === "earn-coins") {
    return source.type === "coins-earned" ? Math.max(0, source.amount) : 0;
  }
  return source.type === "building-placed" &&
    definition.goal.buildingIds.includes(source.buildingId)
    ? 1
    : 0;
}

export function advanceResidentRequest(
  originalState: GameState,
  source: ResidentRequestProgressSource,
  now: number,
  random: RequestRandomSource = Math.random,
): ResidentRequestResult {
  const state = withoutInvalidRequest(originalState, now);
  const active = state.activeResidentRequest;
  if (!active) return { state };

  const definition = getResidentRequestDefinition(active.definitionId);
  if (!definition) return { state };
  const increment = progressIncrement(definition, source);
  if (increment <= 0) return { state };

  const progress = Math.min(definition.goal.target, active.progress + increment);
  if (progress < definition.goal.target) {
    return {
      state: {
        ...state,
        activeResidentRequest: { ...active, progress },
      },
    };
  }

  const rewardedState: GameState = {
    ...state,
    coins: state.coins + definition.rewardCoins,
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
      rewardCoins: definition.rewardCoins,
    },
  };
}

export function describeResidentRequestEvent(event: ResidentRequestEvent): string {
  const definition = getResidentRequestDefinition(event.definitionId);
  const country = definition ? getCountryDefinition(definition.countryId) : undefined;
  const speaker = `${country?.flagEmoji ?? "💬"} ${country?.name ?? "住民"}`;
  if (event.type === "started") return `${speaker}からお願いが届きました！`;
  return `${speaker}のお願い達成！ コイン +${event.rewardCoins}`;
}
