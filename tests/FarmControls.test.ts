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
    selectedCropType: "wheat",
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("FarmControls", () => {
  it("作物モードは種まき用に開き、収穫操作を持たない", () => {
    useGameStore.setState({ interactionMode: "inspect" });

    useGameStore.getState().beginFarming();

    expect(useGameStore.getState()).toMatchObject({
      interactionMode: "farm",
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
        eggs: 8,
        milk: 7,
        pork: 6,
        butter: 4,
        cheese: 2,
        ham: 3,
        sausage: 5,
        bacon: 1,
        pizzas: 2,
      },
      interactionMode: "farm",
      selectedCropType: "wheat",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FarmControls)));
    const tomatoButton = container.querySelector<HTMLButtonElement>('[data-crop="tomato"]');
    const harvestButton = container.querySelector<HTMLButtonElement>('[data-action="harvest"]');

    expect(container.querySelector('[data-crop="wheat"]')?.getAttribute("aria-label"))
      .toBe("小麦の種を選ぶ。種 9、収穫 3");
    expect(tomatoButton?.getAttribute("aria-label"))
      .toBe("トマトの種を選ぶ。種 5、収穫 2");
    expect(container.querySelector('[aria-label="牛乳 7"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="豚肉 6"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="卵 8"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="バター 4"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="チーズ 2"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="ハム 3"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="ソーセージ 5"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="ベーコン 1"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="ピザ 2"]')).not.toBeNull();
    expect(harvestButton).toBeNull();

    await act(async () => {
      tomatoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState()).toMatchObject({
      selectedCropType: "tomato",
    });
    expect(tomatoButton?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain("トマトの種を空の畑へ");
    expect(container.textContent).toContain("成熟した作物は村画面でタップまたはスワイプして収穫");

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

  it("海と川メニューでマップを切り替える", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BottomMenu)));
    const mapButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("海と川"));
    expect(mapButton).toBeDefined();

    await act(async () => {
      mapButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game.currentMap).toBe("sea-and-river");
    expect(container.textContent).toContain("村へ戻る");

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("村へ戻る"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game.currentMap).toBe("village");

    await act(async () => root.unmount());
  });
});
