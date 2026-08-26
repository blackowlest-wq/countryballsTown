import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { SAVE_KEY } from "../../src/game/constants/gameConstants";
import {
  loadGameState,
  saveGameState,
  type StorageLike,
} from "../../src/game/systems/SaveSystem";
import { addInventory } from "../../src/game/systems/InventorySystem";
import { INVENTORY_ITEM_IDS } from "../../src/game/types/Inventory";

function memoryStorage(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("Inventory canonical SaveSystem seam", () => {
  it("semantic inventory recordをcanonical saveへ保存して復元する", () => {
    const storage = memoryStorage();
    const state = addInventory(createInitialGameState(0), "mixed-pizza", 2);

    saveGameState(state, storage, 1_000);
    const raw = JSON.parse(storage.values.get(SAVE_KEY) ?? "null") as {
      inventory?: Record<string, number>;
    };
    const loaded = loadGameState(storage, 2_000);

    expect(Object.keys(raw.inventory ?? {})).toEqual(INVENTORY_ITEM_IDS);
    expect(raw.inventory?.["mixed-pizza"]).toBe(2);
    expect(loaded.inventory["mixed-pizza"]).toBe(2);
  });

  it("旧scalar shapeは複雑な移行をせず初期状態へ戻す", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    const { inventory: _inventory, ...oldShape } = state;
    storage.setItem(SAVE_KEY, JSON.stringify({ ...oldShape, pizzas: 4, wheatFlour: 3 }));

    const loaded = loadGameState(storage, 1_000);

    expect(loaded.coins).toBe(100);
    expect(loaded.inventory["pizza"]).toBe(0);
    expect(loaded.inventory["wheat-flour"]).toBe(0);
    expect(loaded.lastSavedAt).toBe(1_000);
  });
});
