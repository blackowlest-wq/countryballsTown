import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { placeBuilding } from "../src/game/systems/BuildingSystem";
import { chooseResidentDestination, createInitialResident } from "../src/game/systems/ResidentSystem";
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
});
