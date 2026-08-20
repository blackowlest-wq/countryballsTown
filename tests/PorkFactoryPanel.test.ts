// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { placeBuilding } from "../src/game/systems/BuildingSystem";
import { useGameStore } from "../src/store/gameStore";
import { PorkFactoryPanel } from "../src/ui/PorkFactoryPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    porkFactoryPanelBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("PorkFactoryPanel", () => {
  it("未設定の工場にハム・ソーセージ・ベーコンを選べる", async () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "pork-factory",
      8,
      8,
      "pork-factory-test",
    );
    useGameStore.setState({
      game: placed.state,
      porkFactoryPanelBuildingId: "pork-factory-test",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(PorkFactoryPanel)));
    expect(container.textContent).toContain("豚肉工場");
    expect(container.textContent).toContain("ハム");
    expect(container.textContent).toContain("ソーセージ");
    expect(container.textContent).toContain("ベーコン");
    expect(container.querySelectorAll("[data-product]")).toHaveLength(3);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-product="bacon"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game.porkFactoryProductions[0]).toMatchObject({
      productType: "bacon",
    });
    await act(async () => root.unmount());
  });
});
