import {
  PIZZA_BACON_COST,
  PIZZA_CHEESE_COST,
  PIZZA_PRODUCT_AMOUNT,
  PIZZA_TOMATO_COST,
  PIZZA_WHEAT_COST,
} from "../constants/gameConstants";
import type { GameState } from "../types/Village";
import {
  CRAFTING_PRODUCT_TYPES,
  CRAFTING_RECIPES,
  type CraftingIngredientKey,
  type CraftingOutputKey,
  type CraftingProductSales,
  type CraftingProductType,
  type CraftingRecipe,
} from "../types/Crafting";

export type CraftingOutcome =
  | "crafted"
  | "invalid-quantity"
  | "not-enough-materials"
  | "unknown-product";

export interface CraftingResult {
  state: GameState;
  outcome: CraftingOutcome;
  productType: CraftingProductType;
  quantity: number;
}

const recipes: Record<CraftingProductType, CraftingRecipe> = {
  ...CRAFTING_RECIPES,
  pizza: {
    ...CRAFTING_RECIPES.pizza,
    outputAmount: PIZZA_PRODUCT_AMOUNT,
    ingredients: {
      bacon: PIZZA_BACON_COST,
      cheese: PIZZA_CHEESE_COST,
      tomatoes: PIZZA_TOMATO_COST,
      wheatFlour: PIZZA_WHEAT_COST,
    },
  },
};

export function getCraftingRecipe(productType: CraftingProductType): CraftingRecipe {
  return recipes[productType];
}

export function getCraftingProductName(productType: CraftingProductType): string {
  return getCraftingRecipe(productType).name;
}

export function getCraftingProductIcon(productType: CraftingProductType): string {
  return getCraftingRecipe(productType).icon;
}

export function getCraftingIngredientName(ingredient: CraftingIngredientKey): string {
  switch (ingredient) {
    case "bacon":
      return "ベーコン";
    case "cheese":
      return "チーズ";
    case "tomatoes":
      return "トマト";
    case "wheat":
      return "小麦";
    case "wheatFlour":
      return "小麦粉";
    case "sausage":
      return "ソーセージ";
    case "butter":
      return "バター";
    case "eggs":
      return "卵";
    case "ham":
      return "ハム";
    case "rice":
      return "米";
  }
}

export function getCraftingIngredientIcon(ingredient: CraftingIngredientKey): string {
  switch (ingredient) {
    case "bacon":
      return "🥓";
    case "cheese":
      return "🧀";
    case "tomatoes":
      return "🍅";
    case "wheat":
      return "🌾";
    case "wheatFlour":
      return "🥣";
    case "sausage":
      return "🌭";
    case "butter":
      return "🧈";
    case "eggs":
      return "🥚";
    case "ham":
      return "🍖";
    case "rice":
      return "🍚";
  }
}

export function getCraftingProductUnit(productType: CraftingProductType): string {
  return productType === "pizza" ? "枚" : "個";
}

export function getCraftingMaxCraftable(
  state: GameState,
  productType: CraftingProductType,
): number {
  const recipe = getCraftingRecipe(productType);
  const ingredientAmounts = Object.entries(recipe.ingredients) as Array<[
    CraftingIngredientKey,
    number,
  ]>;
  const maximum = ingredientAmounts.reduce(
    (maximum, [ingredient, amount]) => Math.min(maximum, Math.floor(state[ingredient] / amount)),
    Number.POSITIVE_INFINITY,
  );
  return maximum === Number.POSITIVE_INFINITY ? 0 : Math.max(0, maximum);
}

export function craftProduct(
  state: GameState,
  productType: CraftingProductType,
  quantity: number,
): CraftingResult {
  const recipe = recipes[productType];
  const normalizedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
  if (!recipe) {
    return { state, outcome: "unknown-product", productType, quantity: normalizedQuantity };
  }
  if (normalizedQuantity <= 0) {
    return { state, outcome: "invalid-quantity", productType, quantity: normalizedQuantity };
  }
  if (normalizedQuantity > getCraftingMaxCraftable(state, productType)) {
    return { state, outcome: "not-enough-materials", productType, quantity: normalizedQuantity };
  }

  const nextState = { ...state };
  const ingredientAmounts = Object.entries(recipe.ingredients) as Array<[
    CraftingIngredientKey,
    number,
  ]>;
  for (const [ingredient, amount] of ingredientAmounts) {
    nextState[ingredient] -= normalizedQuantity * amount;
  }
  nextState[recipe.outputKey] += normalizedQuantity * recipe.outputAmount;
  return {
    state: nextState,
    outcome: "crafted",
    productType,
    quantity: normalizedQuantity,
  };
}

export function getCraftedProductStock(
  state: Pick<GameState, CraftingOutputKey>,
  productType: CraftingProductType,
): number {
  return state[getCraftingRecipe(productType).outputKey];
}

export function consumeCraftedProducts(
  state: GameState,
  productsSold: CraftingProductSales,
): GameState {
  let changed = false;
  const nextState = { ...state };
  for (const productType of CRAFTING_PRODUCT_TYPES) {
    const sold = productsSold[productType] ?? 0;
    if (sold <= 0) continue;
    const outputKey = getCraftingRecipe(productType).outputKey;
    const nextStock = Math.max(0, nextState[outputKey] - sold);
    if (nextStock === nextState[outputKey]) continue;
    nextState[outputKey] = nextStock;
    changed = true;
  }
  return changed ? nextState : state;
}
