import {
  FOOD_PRODUCT_TYPES,
  getFoodProductDefinition,
  getProductSalePrice,
} from "../data/productCatalog";
import { creditCoins } from "./EconomySystem";
import {
  applyInventoryTransaction,
  getInventoryCount,
  type InventoryDelta,
} from "./InventorySystem";
import type { FoodProductType } from "../types/Product";
import type { MarketOrder, MarketOrderItem } from "../types/MarketOrder";
import type { GameState } from "../types/Village";

export const MARKET_ORDER_COUNT = 3;
export const MARKET_ORDER_PREMIUM_MULTIPLIER = 1.5;
const MAX_MARKET_ORDER_QUANTITY = 99;
const MAX_SEQUENCE = Number.MAX_SAFE_INTEGER;

type MarketOrderAvailability = Pick<GameState, "unlockedBuildings">;

export interface NormalizedMarketOrders {
  marketOrders: MarketOrder[];
  marketOrderSequence: number;
}

export type MarketOrderFulfillmentOutcome =
  | "fulfilled"
  | "order-not-found"
  | "not-enough-inventory";

export interface MarketOrderFulfillmentResult {
  state: GameState;
  outcome: MarketOrderFulfillmentOutcome;
  order?: MarketOrder;
  coinsEarned: number;
  missingItems: MarketOrderItem[];
}

function normalizeSequence(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return 0;
  return Math.min(MAX_SEQUENCE, Math.max(0, value));
}

function normalizeQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return 0;
  return Math.min(MAX_MARKET_ORDER_QUANTITY, Math.max(0, value));
}

function incrementSequence(sequence: number): number {
  return sequence >= MAX_SEQUENCE ? 0 : sequence + 1;
}

function advancePastUsedId(sequence: number, usedIds: ReadonlySet<string>): number {
  let nextSequence = sequence;
  // There can be at most three active ids, so this bounded scan cannot loop
  // indefinitely even when a malformed save contains generated ids.
  for (let attempts = 0; attempts <= MARKET_ORDER_COUNT; attempts += 1) {
    if (!usedIds.has(`market-order-${nextSequence}`)) return nextSequence;
    nextSequence = incrementSequence(nextSequence);
  }
  return nextSequence;
}

function isFoodProductType(value: unknown): value is FoodProductType {
  return typeof value === "string" && FOOD_PRODUCT_TYPES.includes(value as FoodProductType);
}

/** A product can be requested once its shop has been unlocked. */
export function isMarketProductAvailable(
  state: MarketOrderAvailability,
  productType: FoodProductType,
): boolean {
  return getFoodProductDefinition(productType).stores.some((storeId) =>
    state.unlockedBuildings.includes(storeId),
  );
}

export function getAvailableMarketProducts(
  state: MarketOrderAvailability,
): readonly FoodProductType[] {
  return FOOD_PRODUCT_TYPES.filter((productType) =>
    isMarketProductAvailable(state, productType),
  );
}

export function getMarketOrderNormalValue(order: MarketOrder): number {
  return order.items.reduce(
    (total, item) => total + getProductSalePrice(item.productType) * item.quantity,
    0,
  );
}

export function calculateMarketOrderReward(normalValue: number): number {
  const safeNormalValue = Number.isFinite(normalValue) ? Math.max(0, normalValue) : 0;
  const premiumReward = Math.ceil(safeNormalValue * MARKET_ORDER_PREMIUM_MULTIPLIER);
  return Math.max(safeNormalValue + 1, premiumReward);
}

/**
 * Create one order from the currently unlocked food list. The sequence is the
 * sole selector, so loading the same state produces the same order without a
 * random source or retry loop.
 */
export function createMarketOrder(
  state: MarketOrderAvailability,
  sequence: number,
): MarketOrder | null {
  const products = getAvailableMarketProducts(state);
  if (products.length === 0) return null;

  const safeSequence = normalizeSequence(sequence);
  const productType = products[safeSequence % products.length];
  const quantity = 1 + (safeSequence % 2);
  const items: MarketOrderItem[] = [{ productType, quantity }];
  const order: MarketOrder = {
    id: `market-order-${safeSequence}`,
    items,
    rewardCoins: 0,
  };
  return { ...order, rewardCoins: calculateMarketOrderReward(getMarketOrderNormalValue(order)) };
}

function normalizeOrder(
  value: unknown,
  state: MarketOrderAvailability,
): MarketOrder | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    id?: unknown;
    items?: unknown;
  };
  if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) return null;
  if (!Array.isArray(candidate.items)) return null;

  const itemQuantities = new Map<FoodProductType, number>();
  for (const rawItem of candidate.items) {
    if (!rawItem || typeof rawItem !== "object") continue;
    const item = rawItem as { productType?: unknown; quantity?: unknown };
    if (!isFoodProductType(item.productType)) continue;
    if (!isMarketProductAvailable(state, item.productType)) continue;
    const quantity = normalizeQuantity(item.quantity);
    if (quantity <= 0) continue;
    itemQuantities.set(
      item.productType,
      Math.min(
        MAX_MARKET_ORDER_QUANTITY,
        (itemQuantities.get(item.productType) ?? 0) + quantity,
      ),
    );
  }

  const items = [...itemQuantities.entries()].map(([productType, quantity]) => ({
    productType,
    quantity,
  }));
  if (items.length === 0) return null;
  const normalized: MarketOrder = { id: candidate.id.trim(), items, rewardCoins: 0 };
  return {
    ...normalized,
    rewardCoins: calculateMarketOrderReward(getMarketOrderNormalValue(normalized)),
  };
}

/**
 * Repair the order board at the SaveSystem seam. Invalid lines/orders are
 * discarded, and deterministic replacements restore the target count when a
 * shop is available. If no food shop is unlocked, an empty board is safe.
 */
export function normalizeMarketOrders(
  value: unknown,
  sequence: unknown,
  state: MarketOrderAvailability,
): NormalizedMarketOrders {
  const normalizedOrders: MarketOrder[] = [];
  const usedIds = new Set<string>();
  let nextSequence = normalizeSequence(sequence);

  if (Array.isArray(value)) {
    for (const rawOrder of value) {
      const order = normalizeOrder(rawOrder, state);
      if (!order || usedIds.has(order.id)) continue;
      usedIds.add(order.id);
      normalizedOrders.push(order);
      if (normalizedOrders.length >= MARKET_ORDER_COUNT) break;
    }
  }

  while (normalizedOrders.length < MARKET_ORDER_COUNT) {
    nextSequence = advancePastUsedId(nextSequence, usedIds);
    const generated = createMarketOrder(state, nextSequence);
    if (!generated) break;
    nextSequence = incrementSequence(nextSequence);
    if (usedIds.has(generated.id)) continue;
    usedIds.add(generated.id);
    normalizedOrders.push(generated);
  }

  nextSequence = advancePastUsedId(nextSequence, usedIds);

  return { marketOrders: normalizedOrders, marketOrderSequence: nextSequence };
}

/** Keep a runtime state at the same invariant as the save seam. */
export function ensureMarketOrders(state: GameState): GameState {
  const normalized = normalizeMarketOrders(
    state.marketOrders,
    state.marketOrderSequence,
    state,
  );
  return normalized.marketOrders.length === state.marketOrders.length &&
    normalized.marketOrderSequence === state.marketOrderSequence &&
    normalized.marketOrders.every((order, index) => order === state.marketOrders[index])
    ? state
    : { ...state, ...normalized };
}

export function getMarketOrderMissingItems(
  state: GameState,
  order: MarketOrder,
): MarketOrderItem[] {
  return order.items.flatMap((item) =>
    getInventoryCount(state, item.productType) < item.quantity ? [item] : [],
  );
}

/** Read-only availability query shared by the order board and fulfillment. */
export function canFulfillMarketOrder(
  state: GameState,
  order: MarketOrder,
): boolean {
  return getMarketOrderMissingItems(state, order).length === 0;
}

/**
 * Fulfill an order atomically: all lines are checked before any inventory is
 * consumed. The completed order is replaced immediately and the reward goes
 * through the shared coin-cap seam.
 */
export function fulfillMarketOrder(
  state: GameState,
  orderId: string,
): MarketOrderFulfillmentResult {
  const order = state.marketOrders.find((candidate) => candidate.id === orderId);
  if (!order) {
    return {
      state,
      outcome: "order-not-found",
      coinsEarned: 0,
      missingItems: [],
    };
  }

  const missingItems = getMarketOrderMissingItems(state, order);
  if (missingItems.length > 0) {
    return {
      state,
      outcome: "not-enough-inventory",
      order,
      coinsEarned: 0,
      missingItems,
    };
  }

  const deltas: InventoryDelta = {};
  for (const item of order.items) {
    deltas[item.productType] = (deltas[item.productType] ?? 0) - item.quantity;
  }
  const consumed = applyInventoryTransaction(state, deltas);
  const credit = creditCoins(consumed, order.rewardCoins);
  const remainingOrders = state.marketOrders.filter((candidate) => candidate.id !== order.id);
  const replacementSequence = advancePastUsedId(
    state.marketOrderSequence,
    new Set(remainingOrders.map((candidate) => candidate.id)),
  );
  const replacement = createMarketOrder(state, replacementSequence);
  const marketOrders = replacement
    ? [...remainingOrders, replacement]
    : remainingOrders;
  const marketOrderSequence = replacement
    ? incrementSequence(replacementSequence)
    : state.marketOrderSequence;
  return {
    state: {
      ...credit.state,
      marketOrders,
      marketOrderSequence,
    },
    outcome: "fulfilled",
    order,
    coinsEarned: credit.coinsEarned,
    missingItems: [],
  };
}
