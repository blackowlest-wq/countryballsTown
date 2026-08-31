import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { playerBuildingIds } from "../../src/game/data/buildings";
import { useGameStore } from "../../src/store/gameStore";
import { BottomMenu } from "../../src/ui/BottomMenu";
import { BuildControls } from "../../src/ui/BuildControls";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    selectedDistrictId: "agriculture",
    isBuildMenuOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("BuildControls", () => {
  it("建築モードでは選択中の建物だけを表示し、建物変更から一覧を開ける", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        unlockedBuildings: [...playerBuildingIds],
      },
      interactionMode: "build",
      selectedBuildingId: "field",
      selectedDistrictId: "agriculture",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildControls)));
    expect(container.querySelector('[aria-label="建築する建物 畑"]')).not.toBeNull();
    expect(container.querySelector('[data-panel="building-selector"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="change-building"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector('[data-panel="building-selector"]')).not.toBeNull();
    expect(container.querySelector('[data-district-id="agriculture"]')?.getAttribute("aria-selected"))
      .toBe("true");
    expect(container.querySelector('[data-building-id="field"]')).not.toBeNull();
    expect(container.querySelector('[data-building-id="pizza-shop"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-district-id="commercial"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().selectedDistrictId).toBe("agriculture");
    expect(container.querySelector('[data-building-id="pizza-shop"]')).not.toBeNull();
    expect(container.querySelector('[data-building-id="bakery"]')).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-building-id="pizza-shop"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState()).toMatchObject({
      interactionMode: "build",
      selectedBuildingId: "pizza-shop",
      selectedDistrictId: "commercial",
    });
    expect(container.querySelector('[data-panel="building-selector"]')).toBeNull();
    expect(container.querySelector('[aria-label="建築する建物 ピザ屋"]')).not.toBeNull();

    await act(async () => root.unmount());
  });

  it("建築モードをやめると選択中の建物表示を閉じる", async () => {
    useGameStore.setState({
      interactionMode: "build",
      selectedBuildingId: "field",
      selectedDistrictId: "agriculture",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildControls)));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="cancel-build"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().interactionMode).toBe("inspect");
    expect(container.querySelector('[aria-label="建築の操作"]')).toBeNull();

    await act(async () => root.unmount());
  });

  it("建築モード中は下部メニューの建築を選択中として表示する", async () => {
    useGameStore.setState({ interactionMode: "build", selectedBuildingId: "field" });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BottomMenu)));
    const buildButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.includes("建築"));
    expect(buildButton?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => root.unmount());
  });
});
