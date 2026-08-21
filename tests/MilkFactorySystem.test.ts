import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  advanceMilkFactoryProductions,
  configureMilkFactory,
  normalizeMilkFactoryProductions,
  registerMilkFactoryProduction,
} from "../src/game/systems/MilkFactorySystem";
import { placeBuilding } from "../src/game/systems/BuildingSystem";

describe("MilkFactorySystem", () => {
  it("工場を設定すると20秒後の生産予定が登録される", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "milk-factory",
      8,
      8,
      "factory-test",
    );
    const result = configureMilkFactory(placed.state, "factory-test", "butter", 1_000);

    expect(result).toMatchObject({
      outcome: "configured",
      state: {
        milkFactoryProductions: [{
          buildingInstanceId: "factory-test",
          productType: "butter",
          nextProductionAt: 21_000,
        }],
      },
    });
  });

  it("設定済み工場は牛乳1個から加工物を3個自動生産する", () => {
    let state = createInitialGameState(0);
    state = registerMilkFactoryProduction(state, "factory-test");
    state = configureMilkFactory(state, "factory-test", "cheese", 0).state;
    state = { ...state, milk: 3 };

    const advanced = advanceMilkFactoryProductions(state, 60_000);
    expect(advanced).toMatchObject({
      milk: 0,
      butter: 0,
      cheese: 9,
      milkFactoryProductions: [{
        buildingInstanceId: "factory-test",
        productType: "cheese",
        nextProductionAt: 80_000,
      }],
    });
  });

  it("牛乳が足りない時は予定を保持し、牛乳が届いた次の更新で生産する", () => {
    let state = createInitialGameState(0);
    state = registerMilkFactoryProduction(state, "factory-test");
    state = configureMilkFactory(state, "factory-test", "butter", 0).state;

    const waiting = advanceMilkFactoryProductions(state, 20_000);
    expect(waiting).toBe(state);

    const resumed = advanceMilkFactoryProductions({ ...waiting, milk: 1 }, 20_000);
    expect(resumed).toMatchObject({ milk: 0, butter: 3 });
    expect(resumed.milkFactoryProductions[0].nextProductionAt).toBe(40_000);
  });

  it("保存データの工場情報を既存の工場にそろえる", () => {
    const buildings = [
      { id: "factory-a", buildingId: "milk-factory", gridX: 8, gridY: 8 },
      { id: "flower-a", buildingId: "flower", gridX: 10, gridY: 8 },
    ] as const;
    const normalized = normalizeMilkFactoryProductions([
      { buildingInstanceId: "factory-a", productType: "cheese", nextProductionAt: 5_000 },
      { buildingInstanceId: "missing", productType: "butter", nextProductionAt: 5_000 },
    ], buildings, 10_000);

    expect(normalized).toEqual([
      { buildingInstanceId: "factory-a", productType: "cheese", nextProductionAt: 5_000 },
    ]);
  });
});
