import { describe, expect, it } from "vitest";
import { COW_MILK_INTERVAL_MS } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { placeBuilding } from "../../src/game/systems/BuildingSystem";
import {
  collectCowMilk,
  isCowMilkReady,
} from "../../src/game/systems/CowSystem";

function createStateWithCow(now = 1_000) {
  const placed = placeBuilding(
    createInitialGameState(0),
    "cow",
    8,
    8,
    "cow-test",
    now,
  );
  if (!placed.success) throw new Error(`Could not place cow: ${placed.reason}`);
  return placed.state;
}

describe("CowSystem", () => {
  it("配置から30秒後に牛乳を収穫できる", () => {
    const state = createStateWithCow();
    const production = state.cowProductions[0];

    expect(production).toEqual({
      buildingInstanceId: "cow-test",
      milkReadyAt: 1_000 + COW_MILK_INTERVAL_MS,
    });
    expect(isCowMilkReady(production, production.milkReadyAt - 1)).toBe(false);
    expect(isCowMilkReady(production, production.milkReadyAt)).toBe(true);
  });

  it("準備前は収穫できず、準備後は牛乳を2個得て次の30秒が始まる", () => {
    const state = createStateWithCow();
    const readyAt = state.cowProductions[0].milkReadyAt;

    const early = collectCowMilk(state, "cow-test", readyAt - 1);
    expect(early).toMatchObject({ outcome: "not-ready", state });

    const first = collectCowMilk(state, "cow-test", readyAt);
    expect(first.outcome).toBe("collected");
    expect(first.state.milk).toBe(2);
    expect(first.state.cowProductions[0].milkReadyAt)
      .toBe(readyAt + COW_MILK_INTERVAL_MS);

    const second = collectCowMilk(
      first.state,
      "cow-test",
      readyAt + COW_MILK_INTERVAL_MS,
    );
    expect(second.state.milk).toBe(4);
  });
});
