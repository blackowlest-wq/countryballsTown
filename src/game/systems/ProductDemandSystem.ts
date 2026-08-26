import { getLocalDateKey } from "../../utils/date";
import {
  getFoodProductDefinition,
  getProductSalePrice,
} from "../data/productCatalog";
import type { FoodProductType } from "../types/Product";
import type { ProductFavoriteCountryId } from "../data/productCatalog";

/** The country used for a visitor when no country has been unlocked yet. */
export const DEFAULT_VISITOR_COUNTRY_ID: ProductFavoriteCountryId = "poland";

/** Demand is represented as small integer weights used only for selection. */
export const PRODUCT_DEMAND_BASE_WEIGHT = 1;
export const PRODUCT_DEMAND_FAVORITE_BONUS = 2;
export const PRODUCT_DEMAND_DAILY_POPULAR_BONUS = 2;

export interface ProductDemandFactors {
  isFavorite: boolean;
  isDailyPopular: boolean;
  weight: number;
  salePrice: number;
}

type RandomSource = () => number;

function normalizeProductTypes(
  productTypes: readonly FoodProductType[],
): FoodProductType[] {
  return [...new Set(productTypes)]
    .filter((productType) => Boolean(getFoodProductDefinition(productType)))
    .sort();
}

function hashDateAndProducts(dateKey: string, productTypes: readonly FoodProductType[]): number {
  // FNV-1a keeps the result deterministic across browsers and runtimes while
  // avoiding any dependency on the host's random number generator.
  const source = `${dateKey}|${[...productTypes].sort().join(",")}`;
  let hash = 2_166_136_261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/**
 * Derive one daily popular item from the local date and the shop menu.
 * Passing the same date and menu always returns the same item; the menu is
 * sorted for hashing so callers do not need to preserve a particular order.
 */
export function getDailyPopularProduct(
  productTypes: readonly FoodProductType[],
  now: number,
): FoodProductType | null {
  const normalizedProductTypes = normalizeProductTypes(productTypes);
  if (normalizedProductTypes.length === 0) return null;
  const dateKey = getLocalDateKey(now);
  const index = hashDateAndProducts(dateKey, normalizedProductTypes) % normalizedProductTypes.length;
  return normalizedProductTypes[index] ?? null;
}

function isFavoriteProduct(
  productType: FoodProductType,
  countryId: string | undefined,
): boolean {
  const definition = getFoodProductDefinition(productType);
  return Boolean(countryId && definition.favoriteCountries.includes(
    countryId as ProductFavoriteCountryId,
  ));
}

/**
 * Calculate the observable demand signals for one product.
 * `availableProductTypes` is the current menu, not the inventory snapshot;
 * this keeps the daily popular item stable while stock is being sold.
 */
export function getProductDemandFactors(
  productType: FoodProductType,
  countryId: string | undefined,
  now: number,
  availableProductTypes: readonly FoodProductType[],
): ProductDemandFactors {
  const isFavorite = isFavoriteProduct(productType, countryId);
  const isDailyPopular = getDailyPopularProduct(availableProductTypes, now) === productType;
  const weight = PRODUCT_DEMAND_BASE_WEIGHT
    + (isFavorite ? PRODUCT_DEMAND_FAVORITE_BONUS : 0)
    + (isDailyPopular ? PRODUCT_DEMAND_DAILY_POPULAR_BONUS : 0);
  return {
    isFavorite,
    isDailyPopular,
    weight,
    salePrice: getProductSalePrice(productType),
  };
}

export function getProductSalePriceForVisitor(
  productType: FoodProductType,
  countryId: string | undefined,
  now: number,
  availableProductTypes: readonly FoodProductType[],
): number {
  return getProductDemandFactors(productType, countryId, now, availableProductTypes).salePrice;
}

function normalizeRandomValue(randomValue: number): number {
  if (!Number.isFinite(randomValue)) return 0;
  return Math.min(0.999999999999, Math.max(0, randomValue));
}

/** Select one stocked menu item using the additive demand weights. */
export function selectDemandProduct(
  stockedProductTypes: readonly FoodProductType[],
  countryId: string | undefined,
  now: number,
  random: RandomSource = Math.random,
  menuProductTypes: readonly FoodProductType[] = stockedProductTypes,
): FoodProductType | null {
  const normalizedProductTypes = normalizeProductTypes(stockedProductTypes);
  if (normalizedProductTypes.length === 0) return null;
  const normalizedMenuProductTypes = normalizeProductTypes(menuProductTypes);

  const weightedProducts = normalizedProductTypes.map((productType) => ({
    productType,
    weight: getProductDemandFactors(
      productType,
      countryId,
      now,
      normalizedMenuProductTypes,
    ).weight,
  }));
  const totalWeight = weightedProducts.reduce((total, product) => total + product.weight, 0);
  let target = normalizeRandomValue(random()) * totalWeight;
  for (const product of weightedProducts) {
    if (target < product.weight) return product.productType;
    target -= product.weight;
  }
  return weightedProducts[weightedProducts.length - 1].productType;
}
