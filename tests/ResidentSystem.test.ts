import { describe, expect, it } from "vitest";
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
    expect(chooseResidentDestination(japanState, japan, () => 0.9).actionBuildingId).toBe("onsen");

    const italyState = stateWithBuilding(createInitialGameState(0), "pizza-shop", 12, 7);
    const italy = createInitialResident("italy", { x: 4, z: 4 });
    expect(chooseResidentDestination(italyState, italy, () => 0.9).actionBuildingId).toBe("pizza-shop");
  });

  it("allows residents to pass through flowers but stops them at houses", () => {
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

    const houseState = stateWithBuilding(createInitialGameState(0), "house", 12, 8);
    const houseResident = {
      ...createInitialResident("poland", { x: 11.2, z: 8.5 }, "house-walker"),
      destination: { x: 13.5, z: 8.5 },
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
