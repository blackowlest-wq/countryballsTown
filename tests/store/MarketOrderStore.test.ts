import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { withInventory } from "../inventoryFixture";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    isMarketOrderOpen: false,
    notice: null,
  });
});

describe("market order store interaction", () => {
  it("注文板を開閉する", () => {
    useGameStore.getState().openMarketOrderBoard();
    expect(useGameStore.getState().isMarketOrderOpen).toBe(true);

    useGameStore.getState().closeMarketOrderBoard();
    expect(useGameStore.getState().isMarketOrderOpen).toBe(false);
  });

  it("在庫不足の納品を拒否し、状態を変えない", () => {
    const before = useGameStore.getState().game;
    const order = before.marketOrders[0];

    expect(useGameStore.getState().fulfillMarketOrder(order.id)).toBe(false);
    expect(useGameStore.getState().game).toBe(before);
    expect(useGameStore.getState().notice).toContain("材料が足りません");
  });

  it("納品成功時に在庫を消費し、報酬を受け取り注文を補充する", () => {
    const before = createInitialGameState(0);
    const order = before.marketOrders[0];
    useGameStore.setState({
      game: withInventory(before, {
        [order.items[0].productType]: order.items[0].quantity,
      }),
    });

    expect(useGameStore.getState().fulfillMarketOrder(order.id)).toBe(true);
    const state = useGameStore.getState();
    expect(state.game.marketOrders).toHaveLength(3);
    expect(state.game.marketOrders.some((candidate) => candidate.id === order.id)).toBe(false);
    expect(state.game.inventory[order.items[0].productType]).toBe(0);
    expect(state.game.coins).toBe(before.coins + order.rewardCoins);
    expect(state.notice).toContain("納品しました");
  });
});
