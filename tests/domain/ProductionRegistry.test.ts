import { describe, expect, it } from "vitest";
import {
  CHICKEN_EGG_INTERVAL_MS,
  COW_MILK_INTERVAL_MS,
  MILK_FACTORY_INTERVAL_MS,
  PIG_PORK_INTERVAL_MS,
  PORK_FACTORY_INTERVAL_MS,
  WHEAT_FACTORY_INTERVAL_MS,
} from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  advanceFactoryProductions,
  normalizeProductionCollections,
  registerProductionForBuilding,
  removeProductionForBuilding,
} from "../../src/game/systems/ProductionRegistry";

const registrationCases = [
  {
    buildingId: "cow",
    stateKey: "cowProductions",
    instanceId: "cow-1",
    expected: { buildingInstanceId: "cow-1", milkReadyAt: 1_000 + COW_MILK_INTERVAL_MS },
  },
  {
    buildingId: "pig",
    stateKey: "pigProductions",
    instanceId: "pig-1",
    expected: { buildingInstanceId: "pig-1", porkReadyAt: 1_000 + PIG_PORK_INTERVAL_MS },
  },
  {
    buildingId: "chicken",
    stateKey: "chickenProductions",
    instanceId: "chicken-1",
    expected: { buildingInstanceId: "chicken-1", eggReadyAt: 1_000 + CHICKEN_EGG_INTERVAL_MS },
  },
  {
    buildingId: "milk-factory",
    stateKey: "milkFactoryProductions",
    instanceId: "milk-factory-1",
    expected: {
      buildingInstanceId: "milk-factory-1",
      productType: null,
      nextProductionAt: null,
    },
  },
  {
    buildingId: "pork-factory",
    stateKey: "porkFactoryProductions",
    instanceId: "pork-factory-1",
    expected: {
      buildingInstanceId: "pork-factory-1",
      productType: null,
      nextProductionAt: null,
    },
  },
  {
    buildingId: "wheat-factory",
    stateKey: "wheatFactoryProductions",
    instanceId: "wheat-factory-1",
    expected: {
      buildingInstanceId: "wheat-factory-1",
      productType: null,
      nextProductionAt: null,
    },
  },
] as const;

describe("ProductionRegistry", () => {
  it.each(registrationCases)(
    "$buildingIdのregister/removeがstate keyと初期shapeを維持する",
    ({ buildingId, stateKey, instanceId, expected }) => {
      const initial = createInitialGameState(0);
      const registered = registerProductionForBuilding(
        initial,
        buildingId,
        instanceId,
        1_000,
      );

      expect(registered[stateKey]).toEqual([expected]);
      expect(registerProductionForBuilding(registered, buildingId, instanceId, 2_000))
        .toBe(registered);

      const removed = removeProductionForBuilding(registered, buildingId, instanceId);
      expect(removed[stateKey]).toEqual([]);
      expect(removeProductionForBuilding(removed, buildingId, "missing")).toBe(removed);
    },
  );

  it("unknown buildingはregister/removeともstateを変更しない", () => {
    const initial = createInitialGameState(0);

    expect(registerProductionForBuilding(initial, "unknown", "unknown-1", 1_000))
      .toBe(initial);
    expect(removeProductionForBuilding(initial, "unknown", "unknown-1"))
      .toBe(initial);
  });

  it("6種類すべてのcollection normalizeを対応するbuildingへ接続する", () => {
    const buildings = [
      { id: "cow-1", buildingId: "cow", gridX: 1, gridY: 1 },
      { id: "pig-1", buildingId: "pig", gridX: 2, gridY: 2 },
      { id: "chicken-1", buildingId: "chicken", gridX: 3, gridY: 3 },
      { id: "milk-factory-1", buildingId: "milk-factory", gridX: 4, gridY: 4 },
      { id: "pork-factory-1", buildingId: "pork-factory", gridX: 5, gridY: 5 },
      { id: "wheat-factory-1", buildingId: "wheat-factory", gridX: 6, gridY: 6 },
    ] as const;

    const normalized = normalizeProductionCollections({
      cowProductions: [{ buildingInstanceId: "cow-1", milkReadyAt: 500 }],
      pigProductions: [{ buildingInstanceId: "pig-1", porkReadyAt: 501 }],
      chickenProductions: [{ buildingInstanceId: "chicken-1", eggReadyAt: 502 }],
      milkFactoryProductions: [{
        buildingInstanceId: "milk-factory-1",
        productType: "cheese",
        nextProductionAt: 503,
      }],
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-1",
        productType: "sausage",
        nextProductionAt: 504,
      }],
      wheatFactoryProductions: [{
        buildingInstanceId: "wheat-factory-1",
        productType: "wheat-flour",
        nextProductionAt: 505,
      }],
    }, buildings, 1_000);

    expect(normalized).toEqual({
      cowProductions: [{ buildingInstanceId: "cow-1", milkReadyAt: 500 }],
      pigProductions: [{ buildingInstanceId: "pig-1", porkReadyAt: 501 }],
      chickenProductions: [{ buildingInstanceId: "chicken-1", eggReadyAt: 502 }],
      milkFactoryProductions: [{
        buildingInstanceId: "milk-factory-1",
        productType: "cheese",
        nextProductionAt: 503,
      }],
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-1",
        productType: "sausage",
        nextProductionAt: 504,
      }],
      wheatFactoryProductions: [{
        buildingInstanceId: "wheat-factory-1",
        productType: "wheat-flour",
        nextProductionAt: 505,
      }],
    });
  });

  it("1回のadvanceで3種類の工場をすべて進行する", () => {
    const initial = {
      ...createInitialGameState(0),
      wheat: 1,
      milk: 1,
      pork: 1,
      wheatFactoryProductions: [{
        buildingInstanceId: "wheat-factory-1",
        productType: "wheat-flour" as const,
        nextProductionAt: 0,
      }],
      milkFactoryProductions: [{
        buildingInstanceId: "milk-factory-1",
        productType: "butter" as const,
        nextProductionAt: 0,
      }],
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-1",
        productType: "ham" as const,
        nextProductionAt: 0,
      }],
    };

    const advanced = advanceFactoryProductions(initial, 0);

    expect(advanced).toMatchObject({
      wheat: 0,
      wheatFlour: 1,
      milk: 0,
      butter: 3,
      pork: 0,
      ham: 3,
      wheatFactoryProductions: [{ nextProductionAt: WHEAT_FACTORY_INTERVAL_MS }],
      milkFactoryProductions: [{ nextProductionAt: MILK_FACTORY_INTERVAL_MS }],
      porkFactoryProductions: [{ nextProductionAt: PORK_FACTORY_INTERVAL_MS }],
    });
  });
});
