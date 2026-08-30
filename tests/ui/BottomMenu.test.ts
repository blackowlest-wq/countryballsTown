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
    notice: null,
  });
  document.body.replaceChildren();
});

describe("BottomMenu", () => {
  it("4つのメニューを表示し、注文専用ボタンを持たない", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BottomMenu)));
    expect(container.querySelectorAll(".bottom-menu-button")).toHaveLength(4);
    expect(container.textContent).not.toContain("注文");

    const residentButton = [...container.querySelectorAll<HTMLButtonElement>(".bottom-menu-button")]
      .find((button) => button.textContent?.includes("住民"));
    expect(residentButton).not.toBeUndefined();

    await act(async () => residentButton?.click());
    expect(useGameStore.getState().isResidentPanelOpen).toBe(true);

    await act(async () => root.unmount());
  });
});
