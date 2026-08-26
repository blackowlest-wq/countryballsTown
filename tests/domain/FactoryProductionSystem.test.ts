import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import type { GameState } from "../../src/game/types/Village";
import type {
  FactoryProductionDefinition,
  FactoryProductionRecord,
} from "../../src/game/systems/FactoryProductionSystem";
import { createFactoryProductionModule } from "../../src/game/systems/FactoryProductionSystem";
import { withInventory } from "../inventoryFixture";

type TestProductType = "alpha" | "beta";
type TestProduction = FactoryProductionRecord<TestProductType>;

const definition: FactoryProductionDefinition<TestProductType> = {
  buildingId: "milk-factory",
  stateKey: "milkFactoryProductions",
  inputKey: "milk",
  inputAmount: 1,
  intervalMs: 10_000,
  productAmount: 2,
  products: [
    { type: "alpha", outputKey: "butter" },
    { type: "beta", outputKey: "cheese" },
  ],
};

const factoryModule = createFactoryProductionModule<TestProductType>(definition);

const factoryBuildings = [
  { id: "factory-2", buildingId: "milk-factory", gridX: 2, gridY: 2 },
  { id: "factory-1", buildingId: "milk-factory", gridX: 1, gridY: 1 },
  { id: "tree-1", buildingId: "tree", gridX: 3, gridY: 3 },
] as const;

function withProductions(
  productions: TestProduction[],
  milk = 0,
): GameState {
  return withInventory({
    ...createInitialGameState(0),
    milkFactoryProductions: productions,
  } as GameState, { milk });
}

describe("FactoryProductionSystem", () => {
  it("登録・設定・撤去と各結果を共通Interfaceから観測できる", () => {
    const initial = createInitialGameState(0);
    const registered = factoryModule.register(initial, "factory-1");
    expect(registered.milkFactoryProductions).toEqual([{
      buildingInstanceId: "factory-1",
      productType: null,
      nextProductionAt: null,
    }]);
    expect(factoryModule.register(registered, "factory-1")).toBe(registered);
    expect(factoryModule.remove(registered, "missing-factory")).toBe(registered);

    expect(factoryModule.configure(registered, "factory-1", "unknown", 1_000)).toEqual({
      outcome: "invalid-product",
      state: registered,
    });
    expect(factoryModule.configure(registered, "missing-factory", "alpha", 1_000)).toEqual({
      outcome: "not-found",
      state: registered,
    });
    expect(factoryModule.isProductType("alpha")).toBe(true);
    expect(factoryModule.isProductType("unknown")).toBe(false);

    const configured = factoryModule.configure(registered, "factory-1", "beta", 1_000);
    expect(configured).toMatchObject({
      outcome: "configured",
      state: {
        milkFactoryProductions: [{
          buildingInstanceId: "factory-1",
          productType: "beta",
          nextProductionAt: 11_000,
        }],
      },
    });
    expect(factoryModule.remove(registered, "factory-1").milkFactoryProductions).toEqual([]);
  });

  it("正規化は建物順・不正値補正・重複排除を行い、正規化済み配列を再利用する", () => {
    const canonical = [
      { buildingInstanceId: "factory-2", productType: "beta" as const, nextProductionAt: 500 },
      { buildingInstanceId: "factory-1", productType: null, nextProductionAt: null },
    ];
    expect(factoryModule.normalize(canonical, factoryBuildings, 1_000)).toBe(canonical);

    const normalized = factoryModule.normalize([
      { buildingInstanceId: "factory-1", productType: "alpha", nextProductionAt: Number.NaN },
      { buildingInstanceId: "factory-1", productType: "beta", nextProductionAt: 900 },
      { buildingInstanceId: "orphan", productType: "alpha", nextProductionAt: 800 },
      { buildingInstanceId: "factory-2", productType: "unknown", nextProductionAt: 700 },
    ], factoryBuildings, 1_000);
    expect(normalized).toEqual([
      { buildingInstanceId: "factory-2", productType: null, nextProductionAt: null },
      { buildingInstanceId: "factory-1", productType: "alpha", nextProductionAt: 1_000 + definition.intervalMs },
    ]);
  });

  it("catch-upを行い、同じ入力を複数工場が配列順に消費する", () => {
    const state = withProductions([
      { buildingInstanceId: "factory-1", productType: "alpha", nextProductionAt: 0 },
      { buildingInstanceId: "factory-2", productType: "beta", nextProductionAt: 0 },
    ], 3);

    const advanced = factoryModule.advance(state, 20_000);
    expect(advanced).toMatchObject({
      inventory: { milk: 0, butter: 6, cheese: 0 },
      milkFactoryProductions: [
        { buildingInstanceId: "factory-1", productType: "alpha", nextProductionAt: 30_000 },
        { buildingInstanceId: "factory-2", productType: "beta", nextProductionAt: 0 },
      ],
    });
  });

  it("入力不足時は同じstateを返し、入力到着後に予定を進める", () => {
    const waiting = withProductions([
      { buildingInstanceId: "factory-1", productType: "alpha", nextProductionAt: 10_000 },
    ]);
    expect(factoryModule.advance(waiting, 10_000)).toBe(waiting);

    const resumed = factoryModule.advance(withInventory(waiting, { milk: 1 }), 10_000);
    expect(resumed).toMatchObject({
      inventory: { milk: 0, butter: 2 },
      milkFactoryProductions: [{
        buildingInstanceId: "factory-1",
        nextProductionAt: 20_000,
      }],
    });
  });

  it("工場インスタンスの生産速度強化を設定時刻とcatch-up間隔へ適用する", () => {
    const state = {
      ...withProductions([
        { buildingInstanceId: "factory-1", productType: "alpha", nextProductionAt: 0 },
      ], 2),
      buildingUpgrades: { "factory-1": { "production-speed": 2 as const } },
    };

    const advanced = factoryModule.advance(state, 21_000);
    expect(advanced).toMatchObject({
      inventory: { milk: 0, butter: 4 },
      milkFactoryProductions: [{
        buildingInstanceId: "factory-1",
        nextProductionAt: 14_000,
      }],
    });

    const configured = factoryModule.configure(
      { ...state, milkFactoryProductions: [{
        buildingInstanceId: "factory-1",
        productType: null,
        nextProductionAt: null,
      }] },
      "factory-1",
      "alpha",
      1_000,
    );
    expect(configured.state.milkFactoryProductions[0].nextProductionAt).toBe(8_000);
  });
});
