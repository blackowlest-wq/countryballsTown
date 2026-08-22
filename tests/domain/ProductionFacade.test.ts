import { describe, expect, it } from "vitest";
import { COW_MILK_INTERVAL_MS, CHICKEN_EGG_INTERVAL_MS, PIG_PORK_INTERVAL_MS } from "../../src/game/constants/gameConstants";
import { normalizeChickenProductions } from "../../src/game/systems/ChickenSystem";
import { normalizeCowProductions } from "../../src/game/systems/CowSystem";
import { normalizeMilkFactoryProductions } from "../../src/game/systems/MilkFactorySystem";
import { normalizePigProductions } from "../../src/game/systems/PigSystem";
import { normalizePorkFactoryProductions } from "../../src/game/systems/PorkFactorySystem";
import { normalizeWheatFactoryProductions } from "../../src/game/systems/WheatFactorySystem";

describe("production Facade definitions", () => {
  it("livestock FacadeはbuildingIdとreadyAt keyを正しく配線する", () => {
    const buildings = [
      { id: "cow-1", buildingId: "cow", gridX: 1, gridY: 1 },
      { id: "pig-1", buildingId: "pig", gridX: 2, gridY: 2 },
      { id: "chicken-1", buildingId: "chicken", gridX: 3, gridY: 3 },
    ] as const;

    expect(normalizeCowProductions([
      { buildingInstanceId: "cow-1", milkReadyAt: 500 },
    ], buildings, 1_000)).toEqual([
      { buildingInstanceId: "cow-1", milkReadyAt: 500 },
    ]);
    expect(normalizePigProductions([
      { buildingInstanceId: "pig-1", porkReadyAt: 500 },
    ], buildings, 1_000)).toEqual([
      { buildingInstanceId: "pig-1", porkReadyAt: 500 },
    ]);
    expect(normalizeChickenProductions([
      { buildingInstanceId: "chicken-1", eggReadyAt: 500 },
    ], buildings, 1_000)).toEqual([
      { buildingInstanceId: "chicken-1", eggReadyAt: 500 },
    ]);

    expect(normalizeCowProductions([], buildings, 1_000)[0].milkReadyAt)
      .toBe(1_000 + COW_MILK_INTERVAL_MS);
    expect(normalizePigProductions([], buildings, 1_000)[0].porkReadyAt)
      .toBe(1_000 + PIG_PORK_INTERVAL_MS);
    expect(normalizeChickenProductions([], buildings, 1_000)[0].eggReadyAt)
      .toBe(1_000 + CHICKEN_EGG_INTERVAL_MS);
  });

  it("factory FacadeはbuildingIdとproductType/output shapeを正しく配線する", () => {
    const buildings = [
      { id: "milk-1", buildingId: "milk-factory", gridX: 1, gridY: 1 },
      { id: "pork-1", buildingId: "pork-factory", gridX: 2, gridY: 2 },
      { id: "wheat-1", buildingId: "wheat-factory", gridX: 3, gridY: 3 },
    ] as const;

    expect(normalizeMilkFactoryProductions([
      { buildingInstanceId: "milk-1", productType: "cheese", nextProductionAt: 500 },
    ], buildings, 1_000)).toEqual([
      { buildingInstanceId: "milk-1", productType: "cheese", nextProductionAt: 500 },
    ]);
    expect(normalizePorkFactoryProductions([
      { buildingInstanceId: "pork-1", productType: "sausage", nextProductionAt: 500 },
    ], buildings, 1_000)).toEqual([
      { buildingInstanceId: "pork-1", productType: "sausage", nextProductionAt: 500 },
    ]);
    expect(normalizeWheatFactoryProductions([
      { buildingInstanceId: "wheat-1", productType: "wheat-flour", nextProductionAt: 500 },
    ], buildings, 1_000)).toEqual([
      { buildingInstanceId: "wheat-1", productType: "wheat-flour", nextProductionAt: 500 },
    ]);
  });
});
