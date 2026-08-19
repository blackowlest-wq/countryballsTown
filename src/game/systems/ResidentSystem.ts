import {
  RESIDENT_ACTION_MS,
  RESIDENT_DECISION_MAX_MS,
  RESIDENT_DECISION_MIN_MS,
  RESIDENT_FALL_MS,
  RESIDENT_HAPPY_MS,
  RESIDENT_HEART_MS,
  RESIDENT_LOOK_MS,
  RESIDENT_MEETING_DISTANCE,
  RESIDENT_MEETING_WAIT_MS,
  RESIDENT_SLEEP_MS,
  RESIDENT_TALK_MS,
} from "../constants/gameConstants";
import { getBuildingDefinition } from "../data/buildings";
import { getCountryDefinition } from "../data/countries";
import { clampToMap, distanceBetween, moveTowards } from "./MovementSystem";
import type { GridPosition } from "../types/GridPosition";
import {
  getResidentMotion,
  type Resident,
  type ResidentMotion,
} from "../types/Resident";
import type { GameState } from "../types/Village";

export type RandomSource = () => number;

function randomBetween(min: number, max: number, random: RandomSource): number {
  return min + (max - min) * random();
}

function getNextDecisionAt(now: number, random: RandomSource): number {
  return now + randomBetween(RESIDENT_DECISION_MIN_MS, RESIDENT_DECISION_MAX_MS, random);
}

function isBlockedByBuilding(state: GameState, position: GridPosition): boolean {
  return state.buildings.some((instance) => {
    const definition = getBuildingDefinition(instance.buildingId);
    if (!definition || definition.residentCollision !== "blocking") return false;
    const padding = definition.residentCollisionPadding ?? { x: 0.2, z: 0.2 };
    return (
      position.x >= instance.gridX - padding.x &&
      position.x <= instance.gridX + definition.width - 1 + padding.x &&
      position.z >= instance.gridY - padding.z &&
      position.z <= instance.gridY + definition.height - 1 + padding.z
    );
  });
}

function getBuildingFocus(target: { gridX: number; gridY: number; buildingId: string }): GridPosition {
  const definition = getBuildingDefinition(target.buildingId);
  return {
    x: target.gridX + (definition?.width ?? 1) / 2,
    z: target.gridY + (definition?.height ?? 1) / 2,
  };
}

function getBuildingMotion(buildingId: string): ResidentMotion | undefined {
  if (buildingId === "tree" || buildingId === "cherry-tree") return "look-tree";
  if (buildingId === "fountain") return "look-fountain";
  if (buildingId === "house") return "use-building";
  if (getBuildingDefinition(buildingId)?.interactionType) return "use-building";
  return undefined;
}

function getMotionDuration(motion: ResidentMotion): number {
  switch (motion) {
    case "look-tree":
    case "look-fountain":
      return RESIDENT_LOOK_MS;
    case "use-building":
      return RESIDENT_ACTION_MS;
    case "happy":
      return RESIDENT_HAPPY_MS;
    case "sleeping":
      return RESIDENT_SLEEP_MS;
    case "falling":
      return RESIDENT_FALL_MS;
    case "talking":
      return RESIDENT_TALK_MS;
    case "heart":
      return RESIDENT_HEART_MS;
    default:
      return RESIDENT_ACTION_MS;
  }
}

function isImmediateMotion(motion: ResidentMotion | undefined): motion is
  | "happy"
  | "sleeping"
  | "falling" {
  return motion === "happy" || motion === "sleeping" || motion === "falling";
}

function getBuildingDestination(
  state: GameState,
  buildingId: string,
  random: RandomSource,
): ResidentDestination | undefined {
  const target = state.buildings.find((building) => building.buildingId === buildingId);
  const definition = target ? getBuildingDefinition(target.buildingId) : undefined;
  const motion = getBuildingMotion(buildingId);
  if (!target || !definition || !motion) return undefined;
  const offset = random() > 0.5 ? -0.7 : definition.width + 0.7;
  return {
    position: clampToMap({
      x: target.gridX + (definition.width > 1 ? definition.width / 2 : 0.5),
      z: target.gridY + offset,
    }),
    actionBuildingId: buildingId,
    motion,
    lookAt: getBuildingFocus(target),
  };
}

function getSocialDestination(
  state: GameState,
  resident: Resident,
  random: RandomSource,
): ResidentDestination | undefined {
  const candidates = state.residents.filter((candidate) => candidate.id !== resident.id);
  if (candidates.length === 0) return undefined;
  const target = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
  const offsets = [
    { x: 1.05, z: 0 },
    { x: -1.05, z: 0 },
    { x: 0, z: 1.05 },
    { x: 0, z: -1.05 },
  ];
  const firstOffset = Math.floor(random() * offsets.length);
  for (let attempt = 0; attempt < offsets.length; attempt += 1) {
    const offset = offsets[(firstOffset + attempt) % offsets.length];
    const candidate = clampToMap({
      x: target.position.x + offset.x,
      z: target.position.z + offset.z,
    });
    if (!isBlockedByBuilding(state, candidate)) {
      return {
        position: candidate,
        motion: "approach-resident",
        targetResidentId: target.id,
        lookAt: target.position,
      };
    }
  }
  return {
    position: clampToMap(target.position),
    motion: "approach-resident",
    targetResidentId: target.id,
    lookAt: target.position,
  };
}

export interface ResidentDestination {
  position: GridPosition;
  actionBuildingId?: string;
  motion?: ResidentMotion;
  lookAt?: GridPosition;
  targetResidentId?: string;
}

export function chooseResidentDestination(
  state: GameState,
  resident: Resident,
  random: RandomSource = Math.random,
): ResidentDestination {
  const country = getCountryDefinition(resident.countryId);
  const favorite = country?.favoriteBuildingIds.find((buildingId) =>
    state.buildings.some(
      (building) => building.buildingId === buildingId && getBuildingMotion(buildingId),
    ),
  );
  if (favorite && random() > 0.72) {
    const buildingPosition = getBuildingDestination(state, favorite, random);
    if (buildingPosition) return buildingPosition;
  }

  const activityRoll = random();
  if (activityRoll < 0.06) {
    return { position: resident.position, motion: "falling" };
  }
  if (activityRoll < 0.16) {
    return { position: resident.position, motion: "sleeping" };
  }
  if (activityRoll < 0.28) {
    return { position: resident.position, motion: "happy" };
  }
  if (activityRoll < 0.46) {
    const treeBuildingId = state.buildings.some(
      (building) => building.buildingId === "tree",
    )
      ? "tree"
      : "cherry-tree";
    const treeDestination = getBuildingDestination(state, treeBuildingId, random);
    if (treeDestination) return treeDestination;
  }
  if (activityRoll < 0.64) {
    const fountainDestination = getBuildingDestination(state, "fountain", random);
    if (fountainDestination) return fountainDestination;
  }
  if (activityRoll < 0.84) {
    const socialDestination = getSocialDestination(state, resident, random);
    if (socialDestination) return socialDestination;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = clampToMap({
      x: randomBetween(0.7, 19.3, random),
      z: randomBetween(0.7, 19.3, random),
    });
    if (!isBlockedByBuilding(state, candidate)) return { position: candidate, motion: "idle" };
  }
  return { position: { x: 10, z: 14 }, motion: "idle" };
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
    motion: "idle",
    destination: { x: 11.5, z: 6.5 },
  };
}

function beginTimedMotion(
  resident: Resident,
  motion: ResidentMotion,
  now: number,
  extra: Partial<Resident> = {},
): Resident {
  const until = now + getMotionDuration(motion);
  return {
    ...resident,
    state: "action",
    motion,
    motionStartedAt: now,
    motionUntil: until,
    actionUntil: motion === "use-building" ? until : undefined,
    destination: undefined,
    nextDecisionAt: undefined,
    ...extra,
  };
}

export function celebrateResident(
  state: GameState,
  residentId: string,
  now: number,
): GameState {
  return {
    ...state,
    residents: state.residents.map((resident) =>
      resident.id === residentId
        ? beginTimedMotion(resident, "happy", now, {
            actionBuildingId: undefined,
            lookAt: undefined,
            targetResidentId: undefined,
          })
        : resident,
    ),
  };
}

function returnToIdle(
  resident: Resident,
  now: number,
  random: RandomSource,
  delay = getNextDecisionAt(now, random) - now,
): Resident {
  return {
    ...resident,
    state: "idle",
    motion: "idle",
    destination: undefined,
    actionBuildingId: undefined,
    actionUntil: undefined,
    motionStartedAt: undefined,
    motionUntil: undefined,
    lookAt: undefined,
    targetResidentId: undefined,
    nextDecisionAt: now + delay,
  };
}

function nextResidentState(
  resident: Resident,
  state: GameState,
  now: number,
  random: RandomSource,
): Resident {
  const motion = getResidentMotion(resident);
  const motionUntil = resident.motionUntil ?? resident.actionUntil;
  if (resident.state === "action") {
    if ((motionUntil ?? 0) > now) return { ...resident, motion };
    if (motion === "talking") {
      return beginTimedMotion(resident, "heart", now, {
        lookAt: resident.lookAt,
        targetResidentId: resident.targetResidentId,
      });
    }
    return returnToIdle(resident, now, random);
  }

  if (resident.state === "idle" && motion === "approach-resident") {
    if ((resident.nextDecisionAt ?? 0) > now) return resident;
    return returnToIdle(resident, now, random);
  }

  if (resident.state === "idle" && (resident.nextDecisionAt ?? 0) <= now) {
    const destination = chooseResidentDestination(state, resident, random);
    if (isImmediateMotion(destination.motion)) {
      return beginTimedMotion(resident, destination.motion, now, {
        actionBuildingId: undefined,
        lookAt: destination.lookAt,
        targetResidentId: destination.targetResidentId,
      });
    }
    return {
      ...resident,
      state: "walking",
      motion: destination.motion ?? "idle",
      destination: destination.position,
      actionBuildingId: destination.actionBuildingId,
      actionUntil: undefined,
      motionStartedAt: undefined,
      motionUntil: undefined,
      lookAt: destination.lookAt,
      targetResidentId: destination.targetResidentId,
      nextDecisionAt: undefined,
    };
  }
  return resident;
}

function arriveAtDestination(resident: Resident, now: number, random: RandomSource): Resident {
  if (!resident.destination) return resident;
  const motion =
    getResidentMotion(resident) === "idle" && resident.actionBuildingId
      ? getBuildingMotion(resident.actionBuildingId) ?? "idle"
      : getResidentMotion(resident);
  const position = resident.destination;

  if (motion === "approach-resident") {
    return {
      ...resident,
      position,
      state: "idle",
      destination: undefined,
      actionBuildingId: undefined,
      actionUntil: undefined,
      motion: "approach-resident",
      motionStartedAt: now,
      motionUntil: undefined,
      nextDecisionAt: now + RESIDENT_MEETING_WAIT_MS,
    };
  }
  if (
    motion === "look-tree" ||
    motion === "look-fountain" ||
    motion === "use-building"
  ) {
    return beginTimedMotion(
      { ...resident, position },
      motion,
      now,
      {
        actionBuildingId: resident.actionBuildingId,
        lookAt: resident.lookAt,
      },
    );
  }
  return returnToIdle({ ...resident, position }, now, random);
}

function canJoinConversation(resident: Resident): boolean {
  if (resident.state === "action") return false;
  const motion = getResidentMotion(resident);
  return motion === "idle" || motion === "approach-resident";
}

function startConversation(
  resident: Resident,
  partner: Resident,
  now: number,
): Resident {
  return beginTimedMotion(resident, "talking", now, {
    actionBuildingId: undefined,
    lookAt: partner.position,
    targetResidentId: partner.id,
  });
}

function coordinateConversations(
  residents: Resident[],
  now: number,
  random: RandomSource,
): Resident[] {
  const next = [...residents];
  const paired = new Set<string>();
  for (let index = 0; index < next.length; index += 1) {
    const resident = next[index];
    if (
      paired.has(resident.id) ||
      resident.state !== "idle" ||
      getResidentMotion(resident) !== "approach-resident"
    ) {
      continue;
    }
    const partnerIndex = next.findIndex(
      (candidate) => candidate.id === resident.targetResidentId,
    );
    const partner = partnerIndex >= 0 ? next[partnerIndex] : undefined;
    if (
      !partner ||
      partnerIndex === index ||
      !canJoinConversation(partner) ||
      distanceBetween(resident.position, partner.position) > RESIDENT_MEETING_DISTANCE
    ) {
      if ((resident.nextDecisionAt ?? 0) <= now) {
        next[index] = returnToIdle(resident, now, random);
      }
      continue;
    }
    next[index] = startConversation(resident, partner, now);
    next[partnerIndex] = startConversation(partner, resident, now);
    paired.add(resident.id);
    paired.add(partner.id);
  }
  return next;
}

export function advanceResidents(
  state: GameState,
  deltaMs: number,
  now: number,
  random: RandomSource = Math.random,
): GameState {
  const movedResidents = state.residents.map((original) => {
    const resident = nextResidentState(original, state, now, random);
    if (resident.state !== "walking" || !resident.destination) return resident;

    const nextPosition = clampToMap(
      moveTowards(resident.position, resident.destination, deltaMs),
    );
    if (isBlockedByBuilding(state, nextPosition)) {
      return returnToIdle(resident, now, random);
    }
    if (distanceBetween(nextPosition, resident.destination) > 0.12) {
      return { ...resident, position: nextPosition };
    }
    return arriveAtDestination(resident, now, random);
  });
  const residents = coordinateConversations(movedResidents, now, random);
  return residents === state.residents ? state : { ...state, residents };
}

export function getResidentStatusLabel(resident: Resident): string {
  const motion = getResidentMotion(resident);
  if (resident.state === "walking") {
    if (motion === "approach-resident") return "他の住民に近づいています";
    if (motion === "look-tree") return "木へ移動中";
    if (motion === "look-fountain") return "噴水へ移動中";
    if (motion === "use-building") {
      const building = resident.actionBuildingId
        ? getBuildingDefinition(resident.actionBuildingId)
        : undefined;
      return `${building?.name ?? "建物"}へ移動中`;
    }
    return "村をおさんぽ中";
  }
  switch (motion) {
    case "look-tree":
      return "木を見ています";
    case "look-fountain":
      return "噴水を見ています";
    case "use-building": {
      const building = resident.actionBuildingId
        ? getBuildingDefinition(resident.actionBuildingId)
        : undefined;
      return `${building?.name ?? "建物"}を利用中`;
    }
    case "happy":
      return "うれしくて跳ねています";
    case "sleeping":
      return "すやすや眠っています";
    case "falling":
      return "ころびました";
    case "talking":
      return "2人でおしゃべり中";
    case "heart":
      return "仲良くハートが出ています";
    default:
      return "ぼーっとしています";
  }
}
