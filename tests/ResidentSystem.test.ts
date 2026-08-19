import { describe, expect, it } from "vitest";
import {
  RESIDENT_HEART_MS,
  RESIDENT_TALK_MS,
} from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import { placeBuilding } from "../src/game/systems/BuildingSystem";
import {
  advanceResidents,
  chooseResidentDestination,
  createInitialResident,
} from "../src/game/systems/ResidentSystem";
import type { GameState } from "../src/game/types/Village";

function stateWithBuilding(state: GameState, buildingId: string, x: number, z: number): GameState {
  const result = placeBuilding(
    {
      ...state,
      coins: 1_000,
      unlockedBuildings: [...state.unlockedBuildings, buildingId],
    },
    buildingId,
    x,
    z,
    `${buildingId}-test`,
  );
  if (!result.success) throw new Error(`Test placement failed: ${result.reason}`);
  return result.state;
}

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

describe("ResidentSystem", () => {
  it("有効なマップ内の目的地を選ぶ", () => {
    const state = createInitialGameState(0);
    const resident = createInitialResident("poland", { x: 10, z: 10 });
    const destination = chooseResidentDestination(state, resident, () => 0.41);
    expect(destination.position.x).toBeGreaterThanOrEqual(0.5);
    expect(destination.position.x).toBeLessThan(20);
    expect(destination.position.z).toBeGreaterThanOrEqual(0.5);
    expect(destination.position.z).toBeLessThan(20);
  });

  it("日本は温泉、イタリアはピザ屋を行動候補にできる", () => {
    const japanState = stateWithBuilding(createInitialGameState(0), "onsen", 12, 7);
    const japan = createInitialResident("japan", { x: 4, z: 4 });
    expect(chooseResidentDestination(japanState, japan, () => 0.9)).toMatchObject({
      actionBuildingId: "onsen",
      motion: "use-building",
    });

    const italyState = stateWithBuilding(createInitialGameState(0), "pizza-shop", 12, 7);
    const italy = createInitialResident("italy", { x: 4, z: 4 });
    expect(chooseResidentDestination(italyState, italy, () => 0.9)).toMatchObject({
      actionBuildingId: "pizza-shop",
      motion: "use-building",
    });
  });

  it("chooses focus, celebration, sleep, and social motions", () => {
    const base = createInitialGameState(0);
    const poland = createInitialResident("poland", { x: 5, z: 5 }, "poland-test");
    const japan = createInitialResident("japan", { x: 8, z: 5 }, "japan-test");
    const treeState = {
      ...base,
      residents: [poland, japan],
      buildings: [{ id: "tree-test", buildingId: "tree", gridX: 10, gridY: 10 }],
    };
    expect(chooseResidentDestination(treeState, poland, sequence(0.35, 0.5))).toMatchObject({
      motion: "look-tree",
      actionBuildingId: "tree",
    });

    const fountainState = {
      ...treeState,
      buildings: [{ id: "fountain-test", buildingId: "fountain", gridX: 10, gridY: 10 }],
    };
    expect(chooseResidentDestination(fountainState, poland, sequence(0.55, 0.5))).toMatchObject({
      motion: "look-fountain",
      actionBuildingId: "fountain",
    });

    expect(chooseResidentDestination({ ...base, residents: [poland, japan], buildings: [] }, poland, sequence(0.2)))
      .toMatchObject({ motion: "happy" });
    expect(chooseResidentDestination({ ...base, residents: [poland, japan], buildings: [] }, poland, sequence(0.1)))
      .toMatchObject({ motion: "sleeping" });
    expect(chooseResidentDestination({ ...base, residents: [poland, japan], buildings: [] }, poland, sequence(0.01)))
      .toMatchObject({ motion: "falling" });
    expect(chooseResidentDestination({ ...base, residents: [poland, japan], buildings: [] }, poland, sequence(0.75, 0.5, 0.1)))
      .toMatchObject({ motion: "approach-resident", targetResidentId: japan.id });
  });

  it("starts a conversation and follows it with floating hearts", () => {
    const base = createInitialGameState(0);
    const first = {
      ...createInitialResident("poland", { x: 5, z: 5 }, "conversation-first"),
      state: "idle" as const,
      motion: "approach-resident" as const,
      destination: undefined,
      nextDecisionAt: 2_000,
      targetResidentId: "conversation-second",
      lookAt: { x: 6, z: 5 },
      motionStartedAt: 0,
    };
    const second = {
      ...createInitialResident("japan", { x: 6, z: 5 }, "conversation-second"),
      state: "idle" as const,
      motion: "idle" as const,
      destination: undefined,
      nextDecisionAt: 20_000,
    };
    const state = { ...base, buildings: [], residents: [first, second] };

    const talking = advanceResidents(state, 0, 1_000, () => 0.5).residents;
    expect(talking[0]).toMatchObject({ state: "action", motion: "talking" });
    expect(talking[1]).toMatchObject({ state: "action", motion: "talking" });

    const heart = advanceResidents(
      { ...state, residents: talking },
      0,
      1_000 + RESIDENT_TALK_MS,
      () => 0.5,
    ).residents;
    expect(heart[0]).toMatchObject({ state: "action", motion: "heart" });
    expect(heart[1]).toMatchObject({ state: "action", motion: "heart" });

    const idle = advanceResidents(
      { ...state, residents: heart },
      0,
      1_000 + RESIDENT_TALK_MS + RESIDENT_HEART_MS,
      () => 0.5,
    ).residents;
    expect(idle[0]).toMatchObject({ state: "idle", motion: "idle" });
    expect(idle[1]).toMatchObject({ state: "idle", motion: "idle" });
  });

  it("uses object-specific collision padding and lets residents pass through flowers and onsen", () => {
    const flowerState = stateWithBuilding(createInitialGameState(0), "flower", 12, 8);
    const flowerResident = {
      ...createInitialResident("poland", { x: 11.2, z: 8.5 }, "flower-walker"),
      destination: { x: 13.5, z: 8.5 },
    };
    const flowerMoved = advanceResidents(
      { ...flowerState, residents: [flowerResident] },
      1_000,
      1_000,
      () => 0.5,
    ).residents[0];
    expect(flowerMoved.position.x).toBeGreaterThan(flowerResident.position.x);
    expect(flowerMoved.state).toBe("walking");

    const onsenState = stateWithBuilding(createInitialGameState(0), "onsen", 12, 8);
    const onsenResident = {
      ...createInitialResident("japan", { x: 11.2, z: 8.5 }, "onsen-walker"),
      destination: { x: 13.5, z: 8.5 },
    };
    const onsenMoved = advanceResidents(
      { ...onsenState, residents: [onsenResident] },
      1_000,
      1_000,
      () => 0.5,
    ).residents[0];
    expect(onsenMoved.position.x).toBeGreaterThan(onsenResident.position.x);
    expect(onsenMoved.state).toBe("walking");

    const houseState = stateWithBuilding(createInitialGameState(0), "house", 12, 8);
    const houseResident = {
      ...createInitialResident("poland", { x: 10.5, z: 8.5 }, "house-walker"),
      destination: { x: 14, z: 8.5 },
    };
    const houseStopped = advanceResidents(
      { ...houseState, residents: [houseResident] },
      1_000,
      1_000,
      () => 0.5,
    ).residents[0];
    expect(houseStopped.position).toEqual(houseResident.position);
    expect(houseStopped.state).toBe("idle");
  });
});
