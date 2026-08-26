import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { SAVE_KEY } from "../../src/game/constants/gameConstants";
import {
  loadGameState,
  prepareGameStateForSave,
  saveGameState,
  type StorageLike,
} from "../../src/game/systems/SaveSystem";
import { withInventory } from "../inventoryFixture";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("MarketOrder SaveSystem seam", () => {
  it("保存時に注文を3件へcanonicalizeする", () => {
    const state = createInitialGameState(0);
    const malformed = withInventory({
      ...state,
      marketOrders: [{
        id: "kept-order",
        items: [{ productType: "bread", quantity: 1 }],
        rewardCoins: Number.NaN,
      }],
      marketOrderSequence: 10,
    }, { bread: 1 });
    const prepared = prepareGameStateForSave(malformed, 1_000);

    expect(prepared.marketOrders).toHaveLength(3);
    expect(prepared.marketOrders[0]).toMatchObject({ id: "kept-order", rewardCoins: 5 });
    expect(prepared.marketOrderSequence).toBe(12);
  });

  it("新形式の壊れた注文を読み込み時に修復する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem(SAVE_KEY, JSON.stringify({
      ...state,
      marketOrders: [
        { id: "valid", items: [{ productType: "bread", quantity: 1 }], rewardCoins: -100 },
        { id: "broken", items: [{ productType: "not-food", quantity: 1 }] },
      ],
      marketOrderSequence: 30,
    }));

    const loaded = loadGameState(storage, 1_000);

    expect(loaded.marketOrders).toHaveLength(3);
    expect(loaded.marketOrders[0]).toMatchObject({ id: "valid", rewardCoins: 5 });
    expect(loaded.marketOrderSequence).toBe(32);
  });

  it("注文フィールドがない旧saveは初期状態へ戻る", () => {
    const storage = memoryStorage();
    const { marketOrders: _orders, marketOrderSequence: _sequence, ...oldShape } =
      createInitialGameState(0);
    storage.setItem(SAVE_KEY, JSON.stringify(oldShape));

    const loaded = loadGameState(storage, 1_000);

    expect(loaded.coins).toBe(100);
    expect(loaded.marketOrders).toHaveLength(3);
    expect(loaded.marketOrderSequence).toBe(3);
  });

  it("保存と復元後も決定論的な補充順序を維持する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    saveGameState(state, storage, 1_000);
    const loaded = loadGameState(storage, 2_000);

    expect(loaded.marketOrders).toEqual(state.marketOrders);
    expect(loaded.marketOrderSequence).toBe(state.marketOrderSequence);
  });
});
