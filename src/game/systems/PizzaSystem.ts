import {
  PIZZA_BACON_COST,
  PIZZA_CHEESE_COST,
  PIZZA_PRODUCT_AMOUNT,
  PIZZA_TOMATO_COST,
  PIZZA_WHEAT_COST,
} from "../constants/gameConstants";
import type { GameState } from "../types/Village";

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
  bacon: PIZZA_BACON_COST,
  cheese: PIZZA_CHEESE_COST,
  tomatoes: PIZZA_TOMATO_COST,
  wheat: PIZZA_WHEAT_COST,
};

export function getPizzaMaxCraftable(state: Pick<GameState, keyof PizzaRecipeCost>): number {
  return Math.max(
    0,
    Math.min(
      Math.floor(state.bacon / PIZZA_RECIPE.bacon),
      Math.floor(state.cheese / PIZZA_RECIPE.cheese),
      Math.floor(state.tomatoes / PIZZA_RECIPE.tomatoes),
      Math.floor(state.wheat / PIZZA_RECIPE.wheat),
    ),
  );
}

export function craftPizza(state: GameState, quantity: number): PizzaCraftResult {
  const normalizedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
  if (normalizedQuantity <= 0) {
    return { state, outcome: "invalid-quantity", quantity: normalizedQuantity };
  }
  if (normalizedQuantity > getPizzaMaxCraftable(state)) {
    return { state, outcome: "not-enough-materials", quantity: normalizedQuantity };
  }

  return {
    state: {
      ...state,
      bacon: state.bacon - normalizedQuantity * PIZZA_RECIPE.bacon,
      cheese: state.cheese - normalizedQuantity * PIZZA_RECIPE.cheese,
      tomatoes: state.tomatoes - normalizedQuantity * PIZZA_RECIPE.tomatoes,
      wheat: state.wheat - normalizedQuantity * PIZZA_RECIPE.wheat,
      pizzas: state.pizzas + normalizedQuantity * PIZZA_PRODUCT_AMOUNT,
    },
    outcome: "crafted",
    quantity: normalizedQuantity,
  };
}
