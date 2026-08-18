import {
  RESIDENT_ACTION_MS,
  RESIDENT_DECISION_MAX_MS,
  RESIDENT_DECISION_MIN_MS,
} from "../constants/gameConstants";
import { getBuildingDefinition } from "../data/buildings";
import { getCountryDefinition } from "../data/countries";
import { clampToMap, distanceBetween, moveTowards } from "./MovementSystem";
import type { GridPosition } from "../types/GridPosition";
import type { Resident, ResidentState } from "../types/Resident";
import type { GameState } from "../types/Village";

export type RandomSource = () => number;

function randomBetween(min: number, max: number, random: RandomSource): number {
  return min + (max - min) * random();
}

function isBlockedByBuilding(state: GameState, position: GridPosition): boolean {
  return state.buildings.some((instance) => {
    const definition = getBuildingDefinition(instance.buildingId);
    if (!definition || definition.residentCollision !== "blocking") return false;
    return (
      position.x >= instance.gridX - 0.2 &&
      position.x <= instance.gridX + definition.width - 0.8 &&
      position.z >= instance.gridY - 0.2 &&
      position.z <= instance.gridY + definition.height - 0.8
    );
  });
}

function getBuildingDestination(
  state: GameState,
  buildingId: string,
  random: RandomSource,
): GridPosition | undefined {
  const target = state.buildings.find((building) => building.buildingId === buildingId);
  const definition = target ? getBuildingDefinition(target.buildingId) : undefined;
  if (!target || !definition) return undefined;
  const offset = random() > 0.5 ? -0.7 : definition.width + 0.7;
  return clampToMap({
    x: target.gridX + (definition.width > 1 ? definition.width / 2 : 0.5),
    z: target.gridY + offset,
  });
}

export interface ResidentDestination {
  position: GridPosition;
  actionBuildingId?: string;
}

export function chooseResidentDestination(
  state: GameState,
  resident: Resident,
  random: RandomSource = Math.random,
): ResidentDestination {
  const country = getCountryDefinition(resident.countryId);
  const favorite = country?.favoriteBuildingIds.find((buildingId) =>
    state.buildings.some((building) => building.buildingId === buildingId),
  );
  if (favorite && random() > 0.32) {
    const buildingPosition = getBuildingDestination(state, favorite, random);
    if (buildingPosition) return { position: buildingPosition, actionBuildingId: favorite };
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = clampToMap({
      x: randomBetween(0.7, 19.3, random),
      z: randomBetween(0.7, 19.3, random),
    });
    if (!isBlockedByBuilding(state, candidate)) return { position: candidate };
  }
  return { position: { x: 10, z: 14 } };
}

export function createInitialResident(
  countryId: string,
  position: GridPosition,
  id = `resident-${countryId}`,
): Resident {
  return {
    id,
    countryId,
    position: clampToMap(position),
    state: "walking",
    destination: { x: 11.5, z: 6.5 },
  };
}

function nextResidentState(
  resident: Resident,
  state: GameState,
  now: number,
  random: RandomSource,
): Resident {
  if (resident.state === "action") {
    if ((resident.actionUntil ?? 0) > now) return resident;
    return {
      ...resident,
      state: "idle",
      destination: undefined,
      actionBuildingId: undefined,
      actionUntil: undefined,
      nextDecisionAt: now + randomBetween(700, 1_600, random),
    };
  }

  if (resident.state === "idle" && (resident.nextDecisionAt ?? 0) <= now) {
    const destination = chooseResidentDestination(state, resident, random);
    return {
      ...resident,
      state: "walking",
      destination: destination.position,
      actionBuildingId: destination.actionBuildingId,
      nextDecisionAt: undefined,
    };
  }
  return resident;
}

export function advanceResidents(
  state: GameState,
  deltaMs: number,
  now: number,
  random: RandomSource = Math.random,
): GameState {
  const residents = state.residents.map((original) => {
    const resident = nextResidentState(original, state, now, random);
    if (resident.state !== "walking" || !resident.destination) return resident;

    const nextPosition = clampToMap(
      moveTowards(resident.position, resident.destination, deltaMs),
    );
    if (isBlockedByBuilding(state, nextPosition)) {
      return {
        ...resident,
        state: "idle" as const,
        destination: undefined,
        actionBuildingId: undefined,
        nextDecisionAt: now + randomBetween(700, 1_600, random),
      };
    }
    if (distanceBetween(nextPosition, resident.destination) > 0.12) {
      return { ...resident, position: nextPosition };
    }

    const actionDefinition = resident.actionBuildingId
      ? getBuildingDefinition(resident.actionBuildingId)
      : undefined;
    const nextState: ResidentState = actionDefinition?.interactionType ? "action" : "idle";
    return {
      ...resident,
      position: resident.destination,
      destination: undefined,
      state: nextState,
      actionUntil: nextState === "action" ? now + RESIDENT_ACTION_MS : undefined,
      nextDecisionAt:
        nextState === "idle"
          ? now + randomBetween(RESIDENT_DECISION_MIN_MS, RESIDENT_DECISION_MAX_MS, random)
          : undefined,
    };
  });
  return residents === state.residents ? state : { ...state, residents };
}

export function getResidentStatusLabel(resident: Resident): string {
  if (resident.state === "walking" && resident.actionBuildingId) {
    const building = getBuildingDefinition(resident.actionBuildingId);
    return `${building?.name ?? "建物"}へ移動中`;
  }
  if (resident.state === "action") {
    const building = resident.actionBuildingId
      ? getBuildingDefinition(resident.actionBuildingId)
      : undefined;
    return `${building?.name ?? "建物"}でひと休み中`;
  }
  if (resident.state === "walking") return "村をおさんぽ中";
  return "のんびり中";
}
