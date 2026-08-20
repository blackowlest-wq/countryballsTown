// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { useGameStore } from "../src/store/gameStore";
import { FarmControls } from "../src/ui/FarmControls";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    wheatAction: "harvest",
    notice: null,
  });
  document.body.replaceChildren();
});

describe("FarmControls", () => {
  it("小麦モードは誤植えしないよう収穫から始める", () => {
    useGameStore.setState({ interactionMode: "inspect", wheatAction: "plant" });

    useGameStore.getState().beginFarming();

    expect(useGameStore.getState()).toMatchObject({
      interactionMode: "farm",
      wheatAction: "harvest",
    });
  });

  it("種まきと収穫を明示的に切り替える", async () => {
    useGameStore.setState({ interactionMode: "farm", wheatAction: "plant" });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FarmControls)));
    const buttons = [...container.querySelectorAll("button")];
    const plantButton = buttons.find((button) => button.textContent?.includes("種まき"));
    const harvestButton = buttons.find((button) => button.textContent?.includes("収穫"));
    expect(plantButton?.getAttribute("aria-pressed")).toBe("true");
    expect(harvestButton?.getAttribute("aria-pressed")).toBe("false");
    expect(container.textContent).toContain("種を1個使用");

    await act(async () => {
      harvestButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().wheatAction).toBe("harvest");
    expect(plantButton?.getAttribute("aria-pressed")).toBe("false");
    expect(harvestButton?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain("種を2個獲得");

    await act(async () => root.unmount());
  });
});
