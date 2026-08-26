import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  craftFishShopProduct,
  FISH_SHOP_PRODUCT_TYPES,
  getFishShopMaxCraftable,
} from "../../src/game/systems/FishShopSystem";
import { withInventory } from "../inventoryFixture";

describe("FishShopSystem", () => {
  it("魚屋で扱う商品と材料から作れる数を公開する", () => {
    const state = withInventory(createInitialGameState(0), {
      sardine: 2,
      mackerel: 1,
      "sea-bream": 1,
      tuna: 1,
    });

    expect(FISH_SHOP_PRODUCT_TYPES).toEqual([
      "grilled-fish",
      "seafood-bowl",
      "sushi",
      "fish-sandwich",
    ]);
    expect(getFishShopMaxCraftable(state, "grilled-fish")).toBe(2);
    expect(getFishShopMaxCraftable(state, "seafood-bowl")).toBe(1);
    expect(getFishShopMaxCraftable(state, "pizza")).toBe(0);
  });

  it("魚屋以外の商品は魚屋のFacadeから作れない", () => {
    const state = createInitialGameState(0);
    expect(craftFishShopProduct(state, "pizza", 1)).toMatchObject({
      outcome: "unknown-product",
      state,
    });
  });
});
