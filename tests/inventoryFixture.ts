import type { InventoryItemId } from "../src/game/types/Inventory";
import type { GameState } from "../src/game/types/Village";

export function withInventory(
  state: GameState,
  values: Partial<Record<InventoryItemId, number>>,
): GameState {
  return { ...state, inventory: { ...state.inventory, ...values } };
}
