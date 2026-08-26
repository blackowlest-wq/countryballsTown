import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  advanceWheatFactoryProductions,
  configureWheatFactory,
  registerWheatFactoryProduction,
} from "../../src/game/systems/WheatFactorySystem";
import { withInventory } from "../inventoryFixture";

describe("WheatFactorySystem", () => {
  it("小麦工場を設定すると20秒ごとに小麦粉を作る", () => {
    let state = withInventory({
      ...createInitialGameState(0),
      buildings: [{ id: "wheat-factory-test", buildingId: "wheat-factory", gridX: 8, gridY: 8 }],
    }, { wheat: 3 });
    state = registerWheatFactoryProduction(state, "wheat-factory-test");
    state = configureWheatFactory(state, "wheat-factory-test", "wheat-flour", 0).state;

    const produced = advanceWheatFactoryProductions(state, 20_000);
    expect(produced).toMatchObject({ inventory: { wheat: 2, "wheat-flour": 1 } });
    expect(produced.wheatFactoryProductions[0].nextProductionAt).toBe(40_000);
  });

  it("材料がない間は次回生産時刻を進めず、後から材料が入ると追いつく", () => {
    let state = withInventory({
      ...createInitialGameState(0),
      buildings: [{ id: "wheat-factory-test", buildingId: "wheat-factory", gridX: 8, gridY: 8 }],
    }, { wheat: 0 });
    state = registerWheatFactoryProduction(state, "wheat-factory-test");
    state = configureWheatFactory(state, "wheat-factory-test", "wheat-flour", 0).state;
    const waiting = advanceWheatFactoryProductions(state, 20_000);
    expect(waiting).toBe(state);

    const supplied = withInventory(waiting, { wheat: 2 });
    const produced = advanceWheatFactoryProductions(supplied, 20_000);
    expect(produced).toMatchObject({ inventory: { wheat: 1, "wheat-flour": 1 } });
  });
});
