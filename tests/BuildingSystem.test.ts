import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  moveBuilding,
  placeBuilding,
  removeBuilding,
} from "../src/game/systems/BuildingSystem";

describe("BuildingSystem", () => {
  it("空きセルへ建物を配置し、コインを消費する", () => {
    const result = placeBuilding(createInitialGameState(0), "flower", 8, 8, "flower-test");
    expect(result.success).toBe(true);
    expect(result.state.coins).toBe(90);
    expect(result.state.buildings.at(-1)).toMatchObject({ id: "flower-test", gridX: 8, gridY: 8 });
  });

  it("使用済みセル、マップ外、コイン不足では配置できない", () => {
    const initial = createInitialGameState(0);
    expect(placeBuilding(initial, "flower", 3, 3).reason).toBe("occupied");
    expect(placeBuilding(initial, "flower", 20, 20).reason).toBe("out-of-bounds");
    expect(placeBuilding({ ...initial, coins: 0 }, "flower", 8, 8).reason).toBe("not-enough-coins");
  });

  it("配置した建物を移動・撤去できる", () => {
    const placed = placeBuilding(createInitialGameState(0), "flower", 8, 8, "flower-test");
    expect(placed.success).toBe(true);
    const moved = moveBuilding(placed.state, "flower-test", 12, 12);
    expect(moved.success).toBe(true);
    expect(moved.building).toMatchObject({ gridX: 12, gridY: 12 });
    const removed = removeBuilding(moved.state, "flower-test");
    expect(removed.success).toBe(true);
    expect(removed.state.buildings.some((building) => building.id === "flower-test")).toBe(false);
  });

  it("重複IDを持つ建物を配置・移動・撤去で一括変更しない", () => {
    const initial = createInitialGameState(0);
    const duplicated = {
      ...initial,
      unlockedBuildings: [...initial.unlockedBuildings, "onsen"],
      coins: 1_000,
      buildings: [
        ...initial.buildings,
        { id: "duplicate", buildingId: "flower", gridX: 2, gridY: 10 },
        { id: "duplicate", buildingId: "onsen", gridX: 12, gridY: 12 },
      ],
    };

    expect(placeBuilding(duplicated, "tree", 2, 12, "duplicate"))
      .toMatchObject({ success: false, reason: "duplicate-id", state: duplicated });
    expect(moveBuilding(duplicated, "duplicate", 12, 16))
      .toMatchObject({ success: false, reason: "duplicate-id", state: duplicated });
    expect(removeBuilding(duplicated, "duplicate"))
      .toMatchObject({ success: false, reason: "duplicate-id", state: duplicated });
  });
});
