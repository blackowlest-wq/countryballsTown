import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  addInventory,
  applyInventoryTransaction,
  createInitialInventory,
  getInventoryCount,
  isCanonicalInventory,
  normalizeInventory,
  setInventoryCount,
} from "../../src/game/systems/InventorySystem";
import { INVENTORY_ITEM_IDS } from "../../src/game/types/Inventory";

describe("InventorySystem", () => {
  it("全てのsemantic item idを持つcanonical recordを生成する", () => {
    const inventory = createInitialInventory();
    expect(Object.keys(inventory)).toEqual(INVENTORY_ITEM_IDS);
    expect(isCanonicalInventory(inventory)).toBe(true);
  });

  it("在庫変更とtransactionをInventory Interfaceから観測できる", () => {
    const state = createInitialGameState(0);
    const withIngredients = applyInventoryTransaction(state, {
      "wheat-flour": 3,
      cheese: 2,
      tuna: 1,
    });
    expect(getInventoryCount(withIngredients, "wheat-flour")).toBe(3);
    expect(getInventoryCount(withIngredients, "cheese")).toBe(2);
    expect(getInventoryCount(withIngredients, "tuna")).toBe(1);

    const consumed = setInventoryCount(withIngredients, "cheese", 1);
    expect(getInventoryCount(consumed, "cheese")).toBe(1);
    expect(getInventoryCount(addInventory(consumed, "cheese", 2), "cheese")).toBe(3);
    expect(state.inventory).not.toBe(withIngredients.inventory);
  });

  it("save seam用normalizeは不正値を0へ戻し未知キーを捨てる", () => {
    const normalized = normalizeInventory({
      wheat: 2.8,
      "wheat-flour": Number.NaN,
      tuna: -1,
      unknown: 99,
    });
    expect(normalized).toMatchObject({ wheat: 2, "wheat-flour": 0, tuna: 0 });
    expect(Object.keys(normalized)).toEqual(INVENTORY_ITEM_IDS);
    expect(isCanonicalInventory(normalized)).toBe(true);
  });
});
