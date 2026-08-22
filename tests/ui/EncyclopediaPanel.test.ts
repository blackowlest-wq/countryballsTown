
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { syncEncyclopediaCollection } from "../../src/game/systems/EncyclopediaSystem";
import { useGameStore } from "../../src/store/gameStore";
import { BuildingPanel } from "../../src/ui/BuildingPanel";
import { EncyclopediaPanel } from "../../src/ui/EncyclopediaPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    isEncyclopediaOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("EncyclopediaPanel", () => {
  it("ポーランドの家から図鑑を開ける", async () => {
    useGameStore.setState({
      game: createInitialGameState(0),
      selectedBuildingId: "house-1",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildingPanel)));
    expect(container.textContent).toContain("図鑑を見る");

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("図鑑を見る"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().isEncyclopediaOpen).toBe(true);
    expect(useGameStore.getState().selectedBuildingId).toBeNull();
    await act(async () => root.unmount());
  });

  it("収集済みの要素に星を表示し、分類を切り替えられる", async () => {
    const game = syncEncyclopediaCollection({
      ...createInitialGameState(0),
      wheatFlour: 1,
      pizzas: 1,
      encyclopediaCollectedIds: [],
    });
    useGameStore.setState({ game, isEncyclopediaOpen: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(EncyclopediaPanel)));
    expect(container.textContent).toContain("建物");
    expect(container.textContent).toContain("☆");
    expect(container.querySelector('[data-entry="building:house"]')?.textContent ?? "")
      .toContain("☆");

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("加工品"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("小麦粉");
    expect(container.querySelector('[data-entry="processed:wheat-flour"]')?.textContent ?? "")
      .toContain("☆");
    await act(async () => root.unmount());
  });
});
