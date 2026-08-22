import {
  CRAFTING_PRODUCT_TYPES,
  type CraftingProductType,
} from "../types/Crafting";
import type { GameState } from "../types/Village";
import { craftProduct, getCraftingMaxCraftable } from "./CraftingSystem";

export const BAKERY_PRODUCT_TYPES: readonly CraftingProductType[] = CRAFTING_PRODUCT_TYPES.filter(
  (productType) => productType !== "pizza",
);

export function getBakeryMaxCraftable(
  state: GameState,
  productType: CraftingProductType,
): number {
  return BAKERY_PRODUCT_TYPES.includes(productType)
    ? getCraftingMaxCraftable(state, productType)
    : 0;
}

export function craftBakeryProduct(
  state: GameState,
  productType: CraftingProductType,
  quantity: number,
) {
  if (!BAKERY_PRODUCT_TYPES.includes(productType)) {
    return {
      state,
      outcome: "unknown-product" as const,
      productType,
      quantity: Number.isFinite(quantity) ? Math.floor(quantity) : 0,
    };
  }
  return craftProduct(state, productType, quantity);
}
