import type { GameState } from "../types/Village";
import { craftProduct, getCraftingMaxCraftable } from "./CraftingSystem";

export type PizzaCraftOutcome =
  | "crafted"
  | "invalid-quantity"
  | "not-enough-materials";

export interface PizzaCraftResult {
  state: GameState;
  outcome: PizzaCraftOutcome;
  quantity: number;
}

export interface PizzaRecipeCost {
  bacon: number;
  cheese: number;
  tomatoes: number;
  wheat: number;
}

export const PIZZA_RECIPE: PizzaRecipeCost = {
  bacon: 1,
  cheese: 1,
  tomatoes: 1,
  wheat: 2,
};

export function getPizzaMaxCraftable(state: Pick<GameState, keyof PizzaRecipeCost>): number {
  return getCraftingMaxCraftable(state as GameState, "pizza");
}

export function craftPizza(state: GameState, quantity: number): PizzaCraftResult {
  const result = craftProduct(state, "pizza", quantity);
  return {
    state: result.state,
    outcome: result.outcome === "unknown-product" ? "invalid-quantity" : result.outcome,
    quantity: result.quantity,
  };
}
