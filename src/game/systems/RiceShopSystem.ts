import type { CraftingProductType } from "../types/Crafting";
import type { GameState } from "../types/Village";
import { craftProduct, getCraftingMaxCraftable } from "./CraftingSystem";

export const RICE_SHOP_PRODUCT_TYPES: readonly CraftingProductType[] = [
  "onigiri",
  "omurice",
];

export function getRiceShopMaxCraftable(
  state: GameState,
  productType: CraftingProductType,
): number {
  return RICE_SHOP_PRODUCT_TYPES.includes(productType)
    ? getCraftingMaxCraftable(state, productType)
    : 0;
}

export function craftRiceShopProduct(
  state: GameState,
  productType: CraftingProductType,
  quantity: number,
) {
  if (!RICE_SHOP_PRODUCT_TYPES.includes(productType)) {
    return {
      state,
      outcome: "unknown-product" as const,
      productType,
      quantity: Number.isFinite(quantity) ? Math.floor(quantity) : 0,
    };
  }
  return craftProduct(state, productType, quantity);
}
