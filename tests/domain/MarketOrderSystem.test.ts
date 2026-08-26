import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  calculateMarketOrderReward,
  canFulfillMarketOrder,
  createMarketOrder,
  ensureMarketOrders,
  fulfillMarketOrder,
  getAvailableMarketProducts,
  getMarketOrderMissingItems,
  getMarketOrderNormalValue,
  MARKET_ORDER_COUNT,
  normalizeMarketOrders,
} from "../../src/game/systems/MarketOrderSystem";
import { MAX_COINS } from "../../src/game/constants/gameConstants";
import { withInventory } from "../inventoryFixture";

describe("MarketOrderSystem", () => {
  it("注文の在庫充足queryをUIと納品処理で共有する", () => {
    const state = createInitialGameState(0);
    const order = state.marketOrders[0];
    expect(getMarketOrderMissingItems(state, order)).toEqual(order.items);
    expect(canFulfillMarketOrder(state, order)).toBe(false);

    const stocked = withInventory(state, {
      [order.items[0].productType]: order.items[0].quantity,
    });
    expect(getMarketOrderMissingItems(stocked, order)).toEqual([]);
    expect(canFulfillMarketOrder(stocked, order)).toBe(true);
  });

  it("利用可能な食品から決定論的に常時3件を生成する", () => {
    const initial = createInitialGameState(0);
    const availableProducts = getAvailableMarketProducts(initial);

    expect(initial.marketOrders).toHaveLength(MARKET_ORDER_COUNT);
    expect(initial.marketOrderSequence).toBe(MARKET_ORDER_COUNT);
    expect(initial.marketOrders.every((order) =>
      order.items.every((item) => availableProducts.includes(item.productType)),
    )).toBe(true);
    expect(initial.marketOrders.every((order) =>
      order.rewardCoins > getMarketOrderNormalValue(order),
    )).toBe(true);

    const regenerated = ensureMarketOrders({
      ...initial,
      marketOrders: [],
      marketOrderSequence: 0,
    });
    expect(regenerated.marketOrders).toEqual(initial.marketOrders);
    expect(regenerated.marketOrderSequence).toBe(initial.marketOrderSequence);
  });

  it("通常販売価格の1.5倍以上を整数報酬として計算する", () => {
    expect(calculateMarketOrderReward(3)).toBe(5);
    expect(calculateMarketOrderReward(8)).toBe(12);
    expect(calculateMarketOrderReward(0)).toBe(1);
  });

  it("食品店が未解放でも無限ループせず空の注文板を返す", () => {
    const state = {
      ...createInitialGameState(0),
      unlockedBuildings: [],
    };
    expect(getAvailableMarketProducts(state)).toEqual([]);
    expect(createMarketOrder(state, 0)).toBeNull();
    expect(normalizeMarketOrders([], 0, state)).toEqual({
      marketOrders: [],
      marketOrderSequence: 0,
    });
  });

  it("壊れた注文を正規化し、利用可能な食品で3件へ補充する", () => {
    const state = createInitialGameState(0);
    const normalized = normalizeMarketOrders([
      {
        id: "kept-order",
        items: [
          { productType: "bread", quantity: 2 },
          { productType: "unknown", quantity: 2 },
        ],
        rewardCoins: Number.NaN,
      },
      { id: "broken", items: [{ productType: "bread", quantity: 0 }] },
      { id: "kept-order", items: [{ productType: "bread", quantity: 1 }] },
    ], 20, state);

    expect(normalized.marketOrders).toHaveLength(MARKET_ORDER_COUNT);
    expect(normalized.marketOrders[0]).toMatchObject({
      id: "kept-order",
      items: [{ productType: "bread", quantity: 2 }],
      rewardCoins: calculateMarketOrderReward(6),
    });
    expect(new Set(normalized.marketOrders.map((order) => order.id)).size)
      .toBe(MARKET_ORDER_COUNT);
    expect(normalized.marketOrderSequence).toBe(22);
  });

  it("在庫不足なら一部も消費せず、注文とコインを変えない", () => {
    const state = createInitialGameState(0);
    const order = state.marketOrders[0];
    const before = {
      inventory: state.inventory,
      coins: state.coins,
      marketOrders: state.marketOrders,
      marketOrderSequence: state.marketOrderSequence,
    };
    const result = fulfillMarketOrder(state, order.id);

    expect(result.outcome).toBe("not-enough-inventory");
    expect(result.coinsEarned).toBe(0);
    expect(result.state).toMatchObject(before);
  });

  it("納品時に必要在庫を消費し、上限経由で報酬を付与して即時補充する", () => {
    const state = createInitialGameState(0);
    const order = state.marketOrders[0];
    const stocked = withInventory(state, {
      [order.items[0].productType]: order.items[0].quantity,
    });
    const result = fulfillMarketOrder(stocked, order.id);

    expect(result.outcome).toBe("fulfilled");
    expect(result.order).toEqual(order);
    expect(result.state.inventory[order.items[0].productType]).toBe(0);
    expect(result.state.coins).toBe(state.coins + order.rewardCoins);
    expect(result.state.marketOrders).toHaveLength(MARKET_ORDER_COUNT);
    expect(result.state.marketOrders.some((candidate) => candidate.id === order.id)).toBe(false);
  });

  it("上限到達時も納品自体は成功し、付与コインだけを上限で丸める", () => {
    const state = createInitialGameState(0);
    const order = state.marketOrders[0];
    const stocked = withInventory({ ...state, coins: MAX_COINS }, {
      [order.items[0].productType]: order.items[0].quantity,
    });
    const result = fulfillMarketOrder(stocked, order.id);

    expect(result.outcome).toBe("fulfilled");
    expect(result.state.coins).toBe(MAX_COINS);
    expect(result.coinsEarned).toBe(0);
    expect(result.state.inventory[order.items[0].productType]).toBe(0);
  });
});
