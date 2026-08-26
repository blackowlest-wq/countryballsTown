import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { BottomMenu } from "../../src/ui/BottomMenu";

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

describe("BottomMenu", () => {
  it("5つのメニューを表示し、注文ボタンで注文板を開閉する", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BottomMenu)));
    expect(container.querySelectorAll(".bottom-menu-button")).toHaveLength(5);
    const orderButton = [...container.querySelectorAll<HTMLButtonElement>(".bottom-menu-button")]
      .find((button) => button.textContent?.includes("注文"));
    expect(orderButton).not.toBeUndefined();

    await act(async () => orderButton?.click());
    expect(useGameStore.getState().isMarketOrderOpen).toBe(true);
    expect(orderButton?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => orderButton?.click());
    expect(useGameStore.getState().isMarketOrderOpen).toBe(false);

    await act(async () => root.unmount());
  });
});
