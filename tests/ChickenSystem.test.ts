import {
  CHICKEN_EGG_AMOUNT,
  CHICKEN_EGG_INTERVAL_MS,
} from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import { placeBuilding } from "../src/game/systems/BuildingSystem";
import {
  collectChickenEggs,
  isChickenEggReady,
  normalizeChickenProductions,
} from "../src/game/systems/ChickenSystem";
import { describe, expect, it } from "vitest";

function createStateWithChicken(now = 1_000) {
  const placed = placeBuilding(
    createInitialGameState(0),
    "chicken",
    8,
    8,
    "chicken-test",
    now,
  );
  if (!placed.success) throw new Error(`Could not place chicken: ${placed.reason}`);
  return placed.state;
}

describe("ChickenSystem", () => {
  it("配置から30秒後に卵を収穫でき、次の収穫待ちになる", () => {
    const state = createStateWithChicken();
    const production = state.chickenProductions[0];

    expect(production).toEqual({
      buildingInstanceId: "chicken-test",
      eggReadyAt: 1_000 + CHICKEN_EGG_INTERVAL_MS,
    });
    expect(isChickenEggReady(production, production.eggReadyAt - 1)).toBe(false);
    expect(isChickenEggReady(production, production.eggReadyAt)).toBe(true);

    const result = collectChickenEggs(state, "chicken-test", production.eggReadyAt);
    expect(result.outcome).toBe("collected");
    expect(result.state.eggs).toBe(CHICKEN_EGG_AMOUNT);
    expect(result.state.buildings).toContainEqual({
      id: "chicken-test",
      buildingId: "chicken",
      gridX: 8,
      gridY: 8,
    });
    expect(result.state.chickenProductions[0].eggReadyAt)
      .toBe(production.eggReadyAt + CHICKEN_EGG_INTERVAL_MS);
  });

  it("未収穫・存在しない鶏を区別する", () => {
    const state = createStateWithChicken();
    const readyAt = state.chickenProductions[0].eggReadyAt;
    expect(collectChickenEggs(state, "chicken-test", readyAt - 1).outcome).toBe("not-ready");
    expect(collectChickenEggs(state, "missing-chicken", readyAt).outcome).toBe("not-found");
  });

  it("保存データの鶏情報を建物にそろえる", () => {
    const buildings = [
      { id: "chicken-a", buildingId: "chicken", gridX: 8, gridY: 8 },
      { id: "chicken-b", buildingId: "chicken", gridX: 10, gridY: 8 },
    ] as const;
    const normalized = normalizeChickenProductions([
      { buildingInstanceId: "chicken-a", eggReadyAt: 5_000 },
      { buildingInstanceId: "missing", eggReadyAt: 6_000 },
    ], buildings, 10_000);

    expect(normalized).toEqual([
      { buildingInstanceId: "chicken-a", eggReadyAt: 5_000 },
      { buildingInstanceId: "chicken-b", eggReadyAt: 40_000 },
    ]);
  });
});
