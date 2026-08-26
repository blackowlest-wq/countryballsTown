import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { craftPizza, getPizzaMaxCraftable } from "../../src/game/systems/PizzaSystem";
import { withInventory } from "../inventoryFixture";

describe("PizzaSystem", () => {
  it("材料から作れるピザの最大数を計算する", () => {
    const state = withInventory(createInitialGameState(0), {
      bacon: 5,
      cheese: 4,
      tomato: 3,
      "wheat-flour": 9,
    });
    expect(getPizzaMaxCraftable(state)).toBe(3);
  });

  it("ベーコン1、チーズ1、トマト1、小麦粉2を消費してピザを作る", () => {
    const state = withInventory(createInitialGameState(0), {
      bacon: 3,
      cheese: 3,
      tomato: 3,
      "wheat-flour": 6,
    });
    const result = craftPizza(state, 2);
    expect(result).toMatchObject({ outcome: "crafted", quantity: 2 });
    expect(result.state).toMatchObject({
      inventory: {
        bacon: 1,
        cheese: 1,
        tomato: 1,
        "wheat-flour": 2,
        pizza: 2,
      },
    });
  });

  it("材料が足りない数は作らず状態を変えない", () => {
    const state = withInventory(createInitialGameState(0), {
      bacon: 1,
      cheese: 1,
      tomato: 1,
      "wheat-flour": 1,
    });
    expect(craftPizza(state, 1)).toMatchObject({ outcome: "not-enough-materials", state });
    expect(craftPizza(state, 0)).toMatchObject({ outcome: "invalid-quantity", state });
  });
});
