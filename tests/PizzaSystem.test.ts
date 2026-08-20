import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { craftPizza, getPizzaMaxCraftable } from "../src/game/systems/PizzaSystem";

describe("PizzaSystem", () => {
  it("材料から作れるピザの最大数を計算する", () => {
    const state = {
      ...createInitialGameState(0),
      bacon: 5,
      cheese: 4,
      tomatoes: 3,
      wheat: 9,
    };
    expect(getPizzaMaxCraftable(state)).toBe(3);
  });

  it("ベーコン1、チーズ1、トマト1、小麦2を消費してピザを作る", () => {
    const state = {
      ...createInitialGameState(0),
      bacon: 3,
      cheese: 3,
      tomatoes: 3,
      wheat: 6,
    };
    const result = craftPizza(state, 2);
    expect(result).toMatchObject({ outcome: "crafted", quantity: 2 });
    expect(result.state).toMatchObject({
      bacon: 1,
      cheese: 1,
      tomatoes: 1,
      wheat: 2,
      pizzas: 2,
    });
  });

  it("材料が足りない数は作らず状態を変えない", () => {
    const state = {
      ...createInitialGameState(0),
      bacon: 1,
      cheese: 1,
      tomatoes: 1,
      wheat: 1,
    };
    expect(craftPizza(state, 1)).toMatchObject({ outcome: "not-enough-materials", state });
    expect(craftPizza(state, 0)).toMatchObject({ outcome: "invalid-quantity", state });
  });
});
