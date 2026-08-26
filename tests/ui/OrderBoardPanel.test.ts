import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { OrderBoardPanel } from "../../src/ui/OrderBoardPanel";
import { withInventory } from "../inventoryFixture";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    isMarketOrderOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("OrderBoardPanel", () => {
  it("閉じているときは表示せず、開くと注文を3件表示する", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(OrderBoardPanel)));
    expect(container.querySelector('[aria-label="注文板"]')).toBeNull();

    await act(async () => useGameStore.getState().openMarketOrderBoard());
    expect(container.querySelectorAll(".order-card")).toHaveLength(3);
    expect(container.querySelectorAll(".order-fulfill-button")).toHaveLength(3);
    expect([...container.querySelectorAll<HTMLButtonElement>(".order-fulfill-button")]
      .every((button) => button.disabled)).toBe(true);

    await act(async () => root.unmount());
  });

  it("在庫がそろった注文だけ納品操作を有効にし、成功後に補充する", async () => {
    const initial = createInitialGameState(0);
    const order = initial.marketOrders[0];
    useGameStore.setState({
      game: withInventory(initial, {
        [order.items[0].productType]: order.items[0].quantity,
      }),
      isMarketOrderOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(OrderBoardPanel)));
    const buttons = [...container.querySelectorAll<HTMLButtonElement>(".order-fulfill-button")];
    expect(buttons.filter((button) => !button.disabled)).toHaveLength(1);
    expect(container.textContent).toContain("報酬");

    await act(async () => buttons.find((button) => !button.disabled)?.click());
    expect(useGameStore.getState().game.marketOrders).toHaveLength(3);
    expect(useGameStore.getState().game.marketOrders.some((candidate) => candidate.id === order.id))
      .toBe(false);
    expect(useGameStore.getState().notice).toContain("納品しました");

    await act(async () => root.unmount());
  });
});
