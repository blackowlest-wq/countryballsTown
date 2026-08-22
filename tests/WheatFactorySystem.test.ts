import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  advanceWheatFactoryProductions,
  configureWheatFactory,
  normalizeWheatFactoryProductions,
  registerWheatFactoryProduction,
} from "../src/game/systems/WheatFactorySystem";

describe("WheatFactorySystem", () => {
  it("小麦工場を設定すると20秒ごとに小麦粉を作る", () => {
    let state = {
      ...createInitialGameState(0),
      wheat: 3,
      buildings: [{ id: "wheat-factory-test", buildingId: "wheat-factory", gridX: 8, gridY: 8 }],
    };
    state = registerWheatFactoryProduction(state, "wheat-factory-test");
    state = configureWheatFactory(state, "wheat-factory-test", "wheat-flour", 0).state;

    const produced = advanceWheatFactoryProductions(state, 20_000);
    expect(produced).toMatchObject({ wheat: 2, wheatFlour: 1 });
    expect(produced.wheatFactoryProductions[0].nextProductionAt).toBe(40_000);
  });

  it("材料がない間は次回生産時刻を進めず、後から材料が入ると追いつく", () => {
    let state = {
      ...createInitialGameState(0),
      wheat: 0,
      buildings: [{ id: "wheat-factory-test", buildingId: "wheat-factory", gridX: 8, gridY: 8 }],
    };
    state = registerWheatFactoryProduction(state, "wheat-factory-test");
    state = configureWheatFactory(state, "wheat-factory-test", "wheat-flour", 0).state;
    const waiting = advanceWheatFactoryProductions(state, 20_000);
    expect(waiting).toBe(state);

    const supplied = { ...waiting, wheat: 2 };
    const produced = advanceWheatFactoryProductions(supplied, 20_000);
    expect(produced).toMatchObject({ wheat: 1, wheatFlour: 1 });
  });

  it("保存データから存在する小麦工場だけを復元する", () => {
    const buildings = [
      { id: "wheat-factory-test", buildingId: "wheat-factory", gridX: 8, gridY: 8 },
    ];
    const normalized = normalizeWheatFactoryProductions(
      [{ buildingInstanceId: "removed", productType: "wheat-flour", nextProductionAt: 10 }],
      buildings,
      0,
    );
    expect(normalized).toEqual([
      { buildingInstanceId: "wheat-factory-test", productType: null, nextProductionAt: null },
    ]);
  });
});
