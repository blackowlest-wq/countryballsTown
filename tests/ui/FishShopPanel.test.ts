import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { FishShopPanel } from "../../src/ui/FishShopPanel";
import { withInventory } from "../inventoryFixture";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    fishShopPanelBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("FishShopPanel", () => {
  it("焼き魚と海鮮丼を選び、魚の材料を確認して作れる", async () => {
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [{ id: "fish-shop-test", buildingId: "fish-shop", gridX: 8, gridY: 8 }],
      }, { sardine: 1, mackerel: 1, "sea-bream": 1, tuna: 1 }),
      fishShopPanelBuildingId: "fish-shop-test",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FishShopPanel)));
    expect(container.textContent).toContain("魚屋");
    expect(container.querySelector('[data-product="grilled-fish"]')).not.toBeNull();
    expect(container.querySelector('[data-product="seafood-bowl"]')).not.toBeNull();
    expect(container.textContent).toContain("イワシ");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-product="seafood-bowl"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("サバ");
    expect(container.textContent).toContain("タイ");
    expect(container.textContent).toContain("マグロ");

    await act(async () => {
      container.querySelector<HTMLButtonElement>(".fish-shop-panel .full-button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("この材料で作る"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game).toMatchObject({
      inventory: {
        "seafood-bowl": 1,
        sardine: 1,
        mackerel: 0,
        "sea-bream": 0,
        tuna: 0,
      },
    });
    await act(async () => root.unmount());
  });
});
