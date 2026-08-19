import { countBuildings } from "./BuildingSystem";
import { getCountryDefinition } from "../data/countries";
import { villageLevels, type VillageLevelDefinition, type VillageRequirement } from "../data/villageLevels";
import { createInitialResident } from "./ResidentSystem";
import type { GameState } from "../types/Village";

export interface VillageProgressEvent {
  type: "level-up" | "country-unlocked";
  level?: number;
  countryId?: string;
}

export interface VillageProgressResult {
  state: GameState;
  events: VillageProgressEvent[];
}

function requirementMet(state: GameState, requirement: VillageRequirement): boolean {
  if (requirement.type === "resident-count") {
    return state.residents.length >= requirement.minimum;
  }
  const count = (requirement.targetIds ?? []).reduce(
    (total, buildingId) => total + countBuildings(state, buildingId),
    0,
  );
  return count >= requirement.minimum;
}

function levelRequirementsMet(state: GameState, definition: VillageLevelDefinition): boolean {
  return definition.requirements.every((requirement) => requirementMet(state, requirement));
}

function addUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

function addCountryResident(state: GameState, countryId: string): GameState {
  if (state.residents.some((resident) => resident.countryId === countryId)) return state;
  const spawnIndex = state.residents.length;
  const spawn = { x: 13.5 + (spawnIndex % 2) * 1.2, z: 13.5 + Math.floor(spawnIndex / 2) * 1.2 };
  return {
    ...state,
    residents: [...state.residents, createInitialResident(countryId, spawn)],
  };
}

export function evaluateVillageProgress(state: GameState): VillageProgressResult {
  let nextState = state;
  const events: VillageProgressEvent[] = [];

  for (const levelDefinition of villageLevels) {
    if (levelDefinition.level <= nextState.villageLevel) continue;
    if (!levelRequirementsMet(nextState, levelDefinition)) break;

    nextState = { ...nextState, villageLevel: levelDefinition.level };
    events.push({ type: "level-up", level: levelDefinition.level });

    for (const countryId of levelDefinition.unlockCountries) {
      const wasUnlocked = nextState.unlockedCountries.includes(countryId);
      nextState = {
        ...nextState,
        unlockedCountries: addUnique(nextState.unlockedCountries, countryId),
      };
      if (!wasUnlocked) {
        nextState = addCountryResident(nextState, countryId);
        events.push({ type: "country-unlocked", countryId });
      }
    }
    for (const buildingId of levelDefinition.unlockBuildings) {
      nextState = {
        ...nextState,
        unlockedBuildings: addUnique(nextState.unlockedBuildings, buildingId),
      };
    }
  }

  return { state: nextState, events };
}

export function describeProgressEvent(event: VillageProgressEvent): string {
  if (event.type === "level-up") return `村がレベル${event.level}になりました！`;
  const country = event.countryId ? getCountryDefinition(event.countryId) : undefined;
  return `新しい住民、${country?.name ?? "新しい仲間"}がやってきました！`;
}
