import { describe, expect, it } from "vitest";
import { SHOP_VISITOR_SERVICE_MS } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { getProductsForStore } from "../../src/game/data/productCatalog";
import {
  getProductSalePriceForVisitor,
} from "../../src/game/systems/ProductDemandSystem";
import {
  advanceShopVisitors,
  createShopVisitorSimulation,
} from "../../src/game/systems/ShopVisitorSystem";
import type { ShopVisitor } from "../../src/game/types/ShopVisitor";
import { withInventory } from "../inventoryFixture";

const bakery = { id: "bakery-demand-test", buildingId: "bakery", gridX: 8, gridY: 8 } as const;

function bakeryState(unlockedCountries: string[]): ReturnType<typeof createInitialGameState> {
  return withInventory(
    {
      ...createInitialGameState(0),
      buildings: [bakery],
      unlockedCountries,
    },
    { bread: 1 },
  );
}

describe("ShopVisitor demand integration", () => {
  it("来訪客の国をunlockedCountriesから割り当て、未解放時はポーランドへfallbackする", () => {
    const japan = advanceShopVisitors(
      bakeryState(["japan"]),
      { ...createShopVisitorSimulation(0), nextArrivalAt: 0 },
      0,
      0,
      () => 0,
    );
    expect(japan.simulation.visitors[0].countryId).toBe("japan");

    const fallback = advanceShopVisitors(
      bakeryState([]),
      { ...createShopVisitorSimulation(0), nextArrivalAt: 0 },
      0,
      0,
      () => 0,
    );
    expect(fallback.simulation.visitors[0].countryId).toBe("poland");
  });

  it("購入時に商品カタログの固定価格を売上へ反映する", () => {
    const state = bakeryState(["poland"]);
    const visitor: ShopVisitor = {
      id: "visitor-demand-test",
      shopBuildingId: bakery.id,
      countryId: "poland",
      color: "#6fa8dc",
      position: { x: 10, z: 10 },
      destination: { x: 10, z: 10 },
      phase: "buying",
      joinedAt: 0,
      serviceUntil: SHOP_VISITOR_SERVICE_MS,
    };
    const result = advanceShopVisitors(
      state,
      {
        visitors: [visitor],
        nextArrivalAt: Number.POSITIVE_INFINITY,
        nextSequence: 2,
      },
      0,
      SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );
    const expectedPrice = getProductSalePriceForVisitor(
      "bread",
      "poland",
      SHOP_VISITOR_SERVICE_MS,
      getProductsForStore("bakery"),
    );

    expect(result.productsSold).toEqual({ bread: 1 });
    expect(expectedPrice).toBe(3);
    expect(result.coinsEarned).toBe(expectedPrice);
  });
});
