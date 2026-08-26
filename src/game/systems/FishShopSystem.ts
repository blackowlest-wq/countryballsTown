import type { CraftingProductType } from "../types/Crafting";
import type { GameState } from "../types/Village";
import { getProductsForStore } from "../data/productCatalog";
import { craftProduct, getCraftingMaxCraftable } from "./CraftingSystem";

export const FISH_SHOP_PRODUCT_TYPES: readonly CraftingProductType[] = getProductsForStore("fish-shop");

export function getFishShopMaxCraftable(
  state: GameState,
  productType: CraftingProductType,
): number {
  return FISH_SHOP_PRODUCT_TYPES.includes(productType)
    ? getCraftingMaxCraftable(state, productType)
    : 0;
}

export function craftFishShopProduct(
  state: GameState,
  productType: CraftingProductType,
  quantity: number,
) {
  if (!FISH_SHOP_PRODUCT_TYPES.includes(productType)) {
    return {
      state,
      outcome: "unknown-product" as const,
      productType,
      quantity: Number.isFinite(quantity) ? Math.floor(quantity) : 0,
    };
  }
  return craftProduct(state, productType, quantity);
}
