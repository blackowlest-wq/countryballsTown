import {
  FOOD_PRODUCT_TYPES,
  getFoodProductDefinition,
  type ProductIngredientKey,
  type ProductRecipe,
} from "../data/productCatalog";
import type { FoodProductType } from "./Product";
import type { ProductInventoryKey } from "./Inventory";

/**
 * Compatibility names retained for shop and save callers. The actual
 * definitions live in ProductCatalog and this module only projects them into
 * the recipe shape used by CraftingSystem.
 */
export type CraftingProductType = FoodProductType;
export type CraftingIngredientKey = ProductIngredientKey;
export type CraftingOutputKey = ProductInventoryKey;

export interface CraftingRecipe {
  productType: CraftingProductType;
  name: string;
  icon: string;
  outputKey: CraftingOutputKey;
  outputAmount: number;
  ingredients: Partial<Record<CraftingIngredientKey, number>>;
}

export const CRAFTING_PRODUCT_TYPES: readonly CraftingProductType[] = FOOD_PRODUCT_TYPES;

function toCraftingRecipe(productType: CraftingProductType): CraftingRecipe {
  const product = getFoodProductDefinition(productType);
  const recipe = product.recipe as ProductRecipe;
  return {
    productType,
    name: product.name,
    icon: product.icon,
    outputKey: product.inventoryKey,
    outputAmount: recipe.outputAmount,
    ingredients: recipe.ingredients,
  };
}

export const CRAFTING_RECIPES: Record<CraftingProductType, CraftingRecipe> =
  Object.fromEntries(
    CRAFTING_PRODUCT_TYPES.map((productType) => [productType, toCraftingRecipe(productType)]),
  ) as Record<CraftingProductType, CraftingRecipe>;

export type CraftingProductSales = Partial<Record<CraftingProductType, number>>;
