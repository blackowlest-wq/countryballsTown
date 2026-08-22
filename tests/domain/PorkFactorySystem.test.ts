import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  advancePorkFactoryProductions,
  configurePorkFactory,
  normalizePorkFactoryProductions,
  registerPorkFactoryProduction,
} from "../../src/game/systems/PorkFactorySystem";

describe("PorkFactorySystem", () => {
  it("工場を設定すると20秒後の生産予定が登録される", () => {
    const state = registerPorkFactoryProduction(createInitialGameState(0), "factory-test");
    const result = configurePorkFactory(state, "factory-test", "ham", 1_000);

    expect(result).toMatchObject({
      outcome: "configured",
      state: {
        porkFactoryProductions: [{
          buildingInstanceId: "factory-test",
          productType: "ham",
          nextProductionAt: 21_000,
        }],
      },
    });
  });

  it("豚肉1個からハム・ソーセージ・ベーコンを3個作る", () => {
    for (const productType of ["ham", "sausage", "bacon"] as const) {
      let state = createInitialGameState(0);
      state = registerPorkFactoryProduction(state, "factory-test");
      state = configurePorkFactory(state, "factory-test", productType, 0).state;
      const advanced = advancePorkFactoryProductions({ ...state, pork: 1 }, 20_000);

      expect(advanced.pork).toBe(0);
      expect(advanced[productType]).toBe(3);
      expect(advanced.porkFactoryProductions[0].nextProductionAt).toBe(40_000);
    }
  });

  it("豚肉が足りない時は予定を保持し、後から届いた豚肉で再開する", () => {
    let state = createInitialGameState(0);
    state = registerPorkFactoryProduction(state, "factory-test");
    state = configurePorkFactory(state, "factory-test", "bacon", 0).state;

    const waiting = advancePorkFactoryProductions(state, 20_000);
    expect(waiting).toBe(state);

    const resumed = advancePorkFactoryProductions({ ...waiting, pork: 1 }, 20_000);
    expect(resumed).toMatchObject({ pork: 0, bacon: 3 });
    expect(resumed.porkFactoryProductions[0].nextProductionAt).toBe(40_000);
  });

  it("保存データの工場情報を既存の豚肉工場にそろえる", () => {
    const buildings = [
      { id: "factory-a", buildingId: "pork-factory", gridX: 8, gridY: 8 },
      { id: "flower-a", buildingId: "flower", gridX: 10, gridY: 8 },
    ] as const;
    const normalized = normalizePorkFactoryProductions([
      { buildingInstanceId: "factory-a", productType: "sausage", nextProductionAt: 5_000 },
      { buildingInstanceId: "missing", productType: "ham", nextProductionAt: 5_000 },
    ], buildings, 10_000);

    expect(normalized).toEqual([
      { buildingInstanceId: "factory-a", productType: "sausage", nextProductionAt: 5_000 },
    ]);
  });
});
