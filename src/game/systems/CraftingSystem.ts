import type { GameState } from "../types/Village";
import {
  CRAFTING_PRODUCT_TYPES,
  CRAFTING_RECIPES,
  type CraftingIngredientKey,
  type CraftingProductSales,
  type CraftingProductType,
  type CraftingRecipe,
} from "../types/Crafting";
import {
  addInventory,
  consumeInventory,
  getInventoryCount,
} from "./InventorySystem";
import {
  getFoodProductDefinition,
  getProductIngredientDefinition,
} from "../data/productCatalog";
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

export function getCraftingIngredientStock(
  state: GameState,
  ingredient: CraftingIngredientKey,
): number {
  return getInventoryCount(state, ingredient);
}

export function getCraftingRecipe(productType: CraftingProductType): CraftingRecipe {
  return CRAFTING_RECIPES[productType];
}

export function getCraftingProductName(productType: CraftingProductType): string {
  return getCraftingRecipe(productType).name;
}

export function getCraftingProductIcon(productType: CraftingProductType): string {
  return getCraftingRecipe(productType).icon;
}

export function getCraftingIngredientName(ingredient: CraftingIngredientKey): string {
  return getProductIngredientDefinition(ingredient).name;
}

export function getCraftingIngredientIcon(ingredient: CraftingIngredientKey): string {
  return getProductIngredientDefinition(ingredient).icon;
}

export function getCraftingProductUnit(productType: CraftingProductType): string {
  return getFoodProductDefinition(productType).unit;
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
    (maximum, [ingredient, amount]) => Math.min(
      maximum,
      Math.floor(getCraftingIngredientStock(state, ingredient) / amount),
    ),
    Number.POSITIVE_INFINITY,
  );
  return maximum === Number.POSITIVE_INFINITY ? 0 : Math.max(0, maximum);
}

export function craftProduct(
  state: GameState,
  productType: CraftingProductType,
  quantity: number,
): CraftingResult {
  const recipe = CRAFTING_RECIPES[productType];
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

  let nextState = state;
  const ingredientAmounts = Object.entries(recipe.ingredients) as Array<[
    CraftingIngredientKey,
    number,
  ]>;
  for (const [ingredient, amount] of ingredientAmounts) {
    const consumed = normalizedQuantity * amount;
    nextState = consumeInventory(nextState, ingredient, consumed);
  }
  nextState = addInventory(
    nextState,
    recipe.outputKey,
    normalizedQuantity * recipe.outputAmount,
  );
  return {
    state: nextState,
    outcome: "crafted",
    productType,
    quantity: normalizedQuantity,
  };
}

export function getCraftedProductStock(
  state: GameState,
  productType: CraftingProductType,
): number {
  return getInventoryCount(state, getCraftingRecipe(productType).outputKey);
}

export function consumeCraftedProducts(
  state: GameState,
  productsSold: CraftingProductSales,
): GameState {
  let changed = false;
  let nextState = state;
  for (const productType of CRAFTING_PRODUCT_TYPES) {
    const sold = productsSold[productType] ?? 0;
    if (sold <= 0) continue;
    const outputKey = getCraftingRecipe(productType).outputKey;
    const nextStock = Math.max(0, getInventoryCount(nextState, outputKey) - sold);
    if (nextStock === getInventoryCount(nextState, outputKey)) continue;
    nextState = consumeInventory(nextState, outputKey, sold);
    changed = true;
  }
  return changed ? nextState : state;
}
