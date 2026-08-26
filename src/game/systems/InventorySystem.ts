import {
  INVENTORY_ITEM_IDS,
  type InventoryItemId,
  type InventoryState,
} from "../types/Inventory";
import type { GameState } from "../types/Village";

export const inventoryItemIds = INVENTORY_ITEM_IDS;

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function isValidCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

/** Create a complete canonical map for a new village. */
export function createInitialInventory(): InventoryState {
  return Object.fromEntries(inventoryItemIds.map((itemId) => [itemId, 0])) as InventoryState;
}

/** Normalize only at the SaveSystem load/save seam. */
export function normalizeInventory(value: unknown): InventoryState {
  const candidate = value && typeof value === "object"
    ? value as Partial<Record<InventoryItemId, unknown>>
    : {};
  return Object.fromEntries(
    inventoryItemIds.map((itemId) => [itemId, normalizeCount(candidate[itemId])]),
  ) as InventoryState;
}

/** A save is canonical only when every known semantic id is present and valid. */
export function isCanonicalInventory(value: unknown): value is InventoryState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Record<InventoryItemId, unknown>>;
  return inventoryItemIds.every((itemId) => isValidCount(candidate[itemId]));
}

export function getInventoryCount(state: GameState, itemId: InventoryItemId): number {
  return normalizeCount(state.inventory[itemId]);
}

export function setInventoryCount(
  state: GameState,
  itemId: InventoryItemId,
  amount: number,
): GameState {
  const nextAmount = normalizeCount(amount);
  if (state.inventory[itemId] === nextAmount) return state;
  return {
    ...state,
    inventory: { ...state.inventory, [itemId]: nextAmount },
  };
}

export function addInventory(
  state: GameState,
  itemId: InventoryItemId,
  amount: number,
): GameState {
  const delta = Number.isFinite(amount) ? Math.floor(amount) : 0;
  return delta === 0
    ? state
    : setInventoryCount(state, itemId, getInventoryCount(state, itemId) + delta);
}

export function consumeInventory(
  state: GameState,
  itemId: InventoryItemId,
  amount: number,
): GameState {
  const cost = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  if (cost === 0) return state;
  const available = getInventoryCount(state, itemId);
  return available < cost ? state : setInventoryCount(state, itemId, available - cost);
}

export type InventoryDelta = Partial<Record<InventoryItemId, number>>;

/** Apply a group of additive changes without exposing storage details. */
export function applyInventoryTransaction(
  state: GameState,
  deltas: InventoryDelta,
): GameState {
  let nextState = state;
  for (const itemId of inventoryItemIds) {
    const delta = deltas[itemId];
    if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) continue;
    nextState = addInventory(nextState, itemId, delta);
  }
  return nextState;
}
