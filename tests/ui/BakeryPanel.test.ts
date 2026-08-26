
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { BakeryPanel } from "../../src/ui/BakeryPanel";
import { withInventory } from "../inventoryFixture";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    bakeryPanelBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("BakeryPanel", () => {
  it("パン屋で商品を選び、共通の加工処理で作れる", async () => {
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [{ id: "bakery-test", buildingId: "bakery", gridX: 8, gridY: 8 }],
      }, { "wheat-flour": 2, butter: 1 }),
      bakeryPanelBuildingId: "bakery-test",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BakeryPanel)));
    expect(container.textContent).toContain("パン屋");
    expect(container.querySelector('[data-product="bread"]')).not.toBeNull();
    expect(container.querySelector('[data-product="croissant"]')).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-product="croissant"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".bakery-panel .full-button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("この材料で作る"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game).toMatchObject({
      inventory: { "wheat-flour": 0, butter: 0, croissant: 1 },
    });
    await act(async () => root.unmount());
  });
});
