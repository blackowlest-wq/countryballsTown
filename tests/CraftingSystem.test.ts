import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  craftProduct,
  getCraftingMaxCraftable,
} from "../src/game/systems/CraftingSystem";

describe("CraftingSystem", () => {
  it("ピザ屋とパン屋の商品を同じ加工入口で作れる", () => {
    const state = {
      ...createInitialGameState(0),
      bacon: 1,
      cheese: 1,
      tomatoes: 1,
      wheat: 7,
      sausage: 1,
      butter: 1,
      eggs: 1,
      ham: 1,
    };

    expect(craftProduct(state, "pizza", 1).state).toMatchObject({ pizzas: 1, wheat: 5 });
    expect(craftProduct(state, "bread", 1).state).toMatchObject({ bread: 1, wheat: 6 });
    expect(craftProduct(state, "hot-dog", 1).state).toMatchObject({ hotDogs: 1, wheat: 6, sausage: 0 });
    expect(craftProduct(state, "croissant", 1).state).toMatchObject({ croissants: 1, wheat: 5, butter: 0 });
    expect(craftProduct(state, "ham-sandwich", 1).state).toMatchObject({
      hamSandwiches: 1,
      wheat: 6,
      eggs: 0,
      ham: 0,
    });
  });

  it("レシピごとに材料から作れる最大数を計算する", () => {
    const state = {
      ...createInitialGameState(0),
      wheat: 5,
      sausage: 3,
      butter: 2,
      eggs: 4,
      ham: 1,
    };

    expect(getCraftingMaxCraftable(state, "bread")).toBe(5);
    expect(getCraftingMaxCraftable(state, "hot-dog")).toBe(3);
    expect(getCraftingMaxCraftable(state, "croissant")).toBe(2);
    expect(getCraftingMaxCraftable(state, "ham-sandwich")).toBe(1);
  });

  it("材料不足なら状態を変更しない", () => {
    const state = { ...createInitialGameState(0), wheat: 1, sausage: 0 };
    const result = craftProduct(state, "hot-dog", 1);
    expect(result.outcome).toBe("not-enough-materials");
    expect(result.state).toBe(state);
  });
});
