
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { BottomMenu } from "../../src/ui/BottomMenu";
import { FarmControls } from "../../src/ui/FarmControls";
import { MapTravelPanel } from "../../src/ui/MapTravelPanel";
import { withInventory } from "../inventoryFixture";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedCropType: "wheat",
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isMapTravelOpen: false,
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

  it("作物モードを離れると開いていたパネルを閉じ、再入場時にコンパクトへ戻る", async () => {
    useGameStore.setState({ interactionMode: "farm" });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FarmControls)));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="change-crop"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-panel="crop-selector"]')).not.toBeNull();

    await act(async () => useGameStore.setState({ interactionMode: "inspect" }));
    expect(container.querySelector('[data-panel="crop-selector"]')).toBeNull();
    await act(async () => useGameStore.setState({ interactionMode: "farm" }));
    expect(container.querySelector('[data-panel="crop-selector"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="open-inventory"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-panel="inventory-drawer"]')).not.toBeNull();
    await act(async () => useGameStore.setState({ interactionMode: "inspect" }));
    await act(async () => useGameStore.setState({ interactionMode: "farm" }));
    expect(container.querySelector('[data-panel="inventory-drawer"]')).toBeNull();

    await act(async () => root.unmount());
  });

  it("通常はコンパクトに表示し、作物変更パネルと在庫ドロワーを開ける", async () => {
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        wheatSeeds: 9,
        tomatoSeeds: 5,
        riceSeeds: 0,
        miningInventory: {
          ...createInitialGameState(0).miningInventory,
          copper: 2,
        },
      }, {
        wheat: 3,
        tomato: 2,
        eggs: 8,
        milk: 7,
        pork: 6,
        butter: 4,
        cheese: 2,
        ham: 3,
        sausage: 5,
        bacon: 1,
        pizza: 2,
        "grilled-fish": 2,
        "seafood-bowl": 1,
        sardine: 3,
        mackerel: 2,
        "sea-bream": 1,
        tuna: 4,
      }),
      interactionMode: "farm",
      selectedCropType: "wheat",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FarmControls)));
    expect(container.querySelector('[data-panel="crop-selector"]')).toBeNull();
    expect(container.querySelector('[data-panel="inventory-drawer"]')).toBeNull();
    expect(container.querySelector('[aria-label="植える作物 小麦"]')).not.toBeNull();
    expect(container.textContent).toContain("小麦の種を空の畑へ");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="change-crop"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-panel="crop-selector"]')).not.toBeNull();
    expect(container.querySelector('[data-crop="wheat"]')?.getAttribute("aria-label"))
      .toBe("小麦の種を選ぶ。種 9、収穫 3");
    expect(container.querySelector('[data-crop="tomato"]')?.getAttribute("aria-label"))
      .toBe("トマトの種を選ぶ。種 5、収穫 2");
    expect(container.querySelector('[data-crop="rice"]')?.getAttribute("aria-label"))
      .toBe("米の種を選ぶ。種 0、収穫 0。種なし");
    expect(container.querySelector<HTMLButtonElement>('[data-crop="rice"]')?.disabled).toBe(true);
    expect(container.querySelector('[aria-label="牛乳 7"]')).toBeNull();

    const tomatoButton = container.querySelector<HTMLButtonElement>('[data-crop="tomato"]');
    await act(async () => {
      tomatoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState()).toMatchObject({ selectedCropType: "tomato" });
    expect(container.querySelector('[data-panel="crop-selector"]')).toBeNull();
    expect(container.querySelector('[aria-label="植える作物 トマト"]')).not.toBeNull();
    expect(container.textContent).toContain("トマトの種を空の畑へ");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="open-inventory"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-panel="inventory-drawer"]')).not.toBeNull();
    expect(container.querySelector('[data-inventory-category="crops"]')?.getAttribute("aria-selected"))
      .toBe("true");
    expect([...container.querySelectorAll<HTMLButtonElement>("[data-inventory-category]")]
      .every((tab) => tab.getAttribute("aria-controls") === "inventory-panel"))
      .toBe(true);
    expect(container.querySelector("#inventory-panel")).not.toBeNull();
    expect(container.querySelector('[data-inventory-item="wheat"]')).not.toBeNull();
    expect(container.querySelector('[data-inventory-item="rice"]')).toBeNull();
    expect(container.querySelector('[aria-label="イワシ 3"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-category="livestock-fish"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="牛乳 7"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="豚肉 6"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="卵 8"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="イワシ 3"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="マグロ 4"]')).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-category="mining"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="銅 2"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="鉄 0"]')).toBeNull();
    expect(container.querySelector('[data-inventory-item="mining-copper"]')).not.toBeNull();
    expect(container.querySelector('[data-inventory-category="mining"]')?.getAttribute("aria-controls"))
      .toBe("inventory-panel");
    expect(container.querySelector("#inventory-panel")).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-filter="all"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="鉄 0"]')).not.toBeNull();
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-filter="owned"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="鉄 0"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-category="processed"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="バター 4"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="ピザ 2"]')).toBeNull();
    expect(container.querySelector('[aria-label="おにぎり 0"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-filter="all"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="小麦粉 0"]')).not.toBeNull();
    expect(container.querySelector('[data-inventory-filter="all"]')?.getAttribute("aria-pressed"))
      .toBe("true");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-inventory-category="food"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[aria-label="ピザ 2"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="バター 4"]')).toBeNull();
    expect(container.querySelectorAll('[data-inventory-category]')).toHaveLength(5);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[aria-label="在庫を閉じる"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-panel="inventory-drawer"]')).toBeNull();

    await act(async () => root.unmount());
  }, 15_000);

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

  it("移動メニューで行き先を選べる", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(
      "div",
      null,
      createElement(BottomMenu),
      createElement(MapTravelPanel),
    )));
    const mapButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("移動"));
    expect(mapButton).toBeDefined();

    await act(async () => {
      mapButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game.currentMap).toBe("village");
    expect(useGameStore.getState().isMapTravelOpen).toBe(true);
    expect(container.querySelector('[data-map="sea-and-river"]')).not.toBeNull();
    expect(container.querySelector('[data-map="cave"]')).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-map="sea-and-river"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState()).toMatchObject({
      isMapTravelOpen: false,
      game: { currentMap: "sea-and-river" },
    });

    await act(async () => root.unmount());
  });
});
