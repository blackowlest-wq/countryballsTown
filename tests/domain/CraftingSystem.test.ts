import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  craftProduct,
  getCraftingMaxCraftable,
} from "../../src/game/systems/CraftingSystem";
import { withInventory } from "../inventoryFixture";

describe("CraftingSystem", () => {
  it("ピザ屋とパン屋の商品を同じ加工入口で作れる", () => {
    const state = withInventory(createInitialGameState(0), {
      bacon: 1,
      cheese: 1,
      tomato: 1,
      "wheat-flour": 7,
      sausage: 1,
      butter: 1,
      eggs: 1,
      ham: 1,
    });

    expect(craftProduct(state, "pizza", 1).state).toMatchObject({
      inventory: { pizza: 1, "wheat-flour": 5 },
    });
    expect(craftProduct(state, "bread", 1).state).toMatchObject({
      inventory: { bread: 1, "wheat-flour": 6 },
    });
    expect(craftProduct(state, "hot-dog", 1).state).toMatchObject({
      inventory: { "hot-dog": 1, "wheat-flour": 6, sausage: 0 },
    });
    expect(craftProduct(state, "croissant", 1).state).toMatchObject({
      inventory: { croissant: 1, "wheat-flour": 5, butter: 0 },
    });
    expect(craftProduct(state, "ham-sandwich", 1).state).toMatchObject({
      inventory: {
        "ham-sandwich": 1,
        "wheat-flour": 6,
        eggs: 0,
        ham: 0,
      },
    });
  });

  it("レシピごとに材料から作れる最大数を計算する", () => {
    const state = withInventory(createInitialGameState(0), {
      "wheat-flour": 5,
      sausage: 3,
      butter: 2,
      eggs: 4,
      ham: 1,
    });

    expect(getCraftingMaxCraftable(state, "bread")).toBe(5);
    expect(getCraftingMaxCraftable(state, "hot-dog")).toBe(3);
    expect(getCraftingMaxCraftable(state, "croissant")).toBe(2);
    expect(getCraftingMaxCraftable(state, "ham-sandwich")).toBe(1);
  });

  it("材料不足なら状態を変更しない", () => {
    const state = withInventory(createInitialGameState(0), { "wheat-flour": 1, sausage: 0 });
    const result = craftProduct(state, "hot-dog", 1);
    expect(result.outcome).toBe("not-enough-materials");
    expect(result.state).toBe(state);
  });

  it("ごはん屋のおにぎりとオムライスを米と材料から作れる", () => {
    const state = withInventory(createInitialGameState(0), {
      rice: 4,
      tomato: 1,
      eggs: 2,
    });

    expect(craftProduct(state, "onigiri", 1).state).toMatchObject({
      inventory: { rice: 3, onigiri: 1 },
    });
    expect(craftProduct(state, "omurice", 1).state).toMatchObject({
      inventory: { rice: 2, tomato: 0, eggs: 0, omurice: 1 },
    });
  });

  it("魚屋の焼き魚と海鮮丼を魚インベントリから作れる", () => {
    const state = withInventory(createInitialGameState(0), {
      sardine: 2,
      mackerel: 1,
      "sea-bream": 1,
      tuna: 1,
    });

    expect(getCraftingMaxCraftable(state, "grilled-fish")).toBe(2);
    expect(getCraftingMaxCraftable(state, "seafood-bowl")).toBe(1);
    expect(craftProduct(state, "grilled-fish", 1).state).toMatchObject({
      inventory: {
        "grilled-fish": 1,
        sardine: 1,
        mackerel: 1,
        "sea-bream": 1,
        tuna: 1,
      },
    });
    expect(craftProduct(state, "seafood-bowl", 1).state).toMatchObject({
      inventory: {
        "seafood-bowl": 1,
        sardine: 2,
        mackerel: 0,
        "sea-bream": 0,
        tuna: 0,
      },
    });
  });

  it("中華食堂とハンバーガーショップの料理を既存素材から作れる", () => {
    const state = withInventory(createInitialGameState(0), {
      rice: 1,
      eggs: 1,
      "wheat-flour": 1,
      pork: 1,
    });

    expect(craftProduct(state, "fried-rice", 1).state).toMatchObject({
      inventory: { rice: 0, eggs: 0, "fried-rice": 1 },
    });
    expect(craftProduct(state, "hamburger", 1).state).toMatchObject({
      inventory: { "wheat-flour": 0, pork: 0, hamburger: 1 },
    });
  });
});
