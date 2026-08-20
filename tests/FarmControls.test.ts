// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { useGameStore } from "../src/store/gameStore";
import { BottomMenu } from "../src/ui/BottomMenu";
import { FarmControls } from "../src/ui/FarmControls";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    cropAction: "harvest",
    selectedCropType: "wheat",
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("FarmControls", () => {
  it("作物モードは誤植えしないよう収穫から始める", () => {
    useGameStore.setState({ interactionMode: "inspect", cropAction: "plant" });

    useGameStore.getState().beginFarming();

    expect(useGameStore.getState()).toMatchObject({
      interactionMode: "farm",
      cropAction: "harvest",
    });
  });

  it("小麦とトマトの在庫を表示し、種を選ぶと種まきへ切り替える", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        wheatSeeds: 9,
        wheat: 3,
        tomatoSeeds: 5,
        tomatoes: 2,
      },
      interactionMode: "farm",
      cropAction: "harvest",
      selectedCropType: "wheat",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FarmControls)));
    const tomatoButton = container.querySelector<HTMLButtonElement>('[data-crop="tomato"]');
    const plantButton = container.querySelector<HTMLButtonElement>('[data-action="plant"]');
    const harvestButton = container.querySelector<HTMLButtonElement>('[data-action="harvest"]');

    expect(container.querySelector('[data-crop="wheat"]')?.getAttribute("aria-label"))
      .toBe("小麦の種を選ぶ。種 9、収穫 3");
    expect(tomatoButton?.getAttribute("aria-label"))
      .toBe("トマトの種を選ぶ。種 5、収穫 2");
    expect(harvestButton?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => {
      tomatoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState()).toMatchObject({
      selectedCropType: "tomato",
      cropAction: "plant",
    });
    expect(tomatoButton?.getAttribute("aria-pressed")).toBe("true");
    expect(plantButton?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain("トマトの種を空の畑へ");

    await act(async () => {
      harvestButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().cropAction).toBe("harvest");
    expect(container.textContent).toContain("作物1個・種2個");

    await act(async () => root.unmount());
  });

  it("下部メニューを小麦から作物へ変更する", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BottomMenu)));
    const cropButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("作物"));
    expect(cropButton).toBeDefined();
    expect(container.textContent).not.toContain("小麦");

    await act(async () => {
      cropButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().interactionMode).toBe("farm");

    await act(async () => root.unmount());
  });
});
