// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { playerBuildingIds } from "../src/game/data/buildings";
import { useGameStore } from "../src/store/gameStore";
import { BuildMenu } from "../src/ui/BuildMenu";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    isBuildMenuOpen: false,
  });
  document.body.replaceChildren();
});

describe("BuildMenu", () => {
  it("カテゴリで絞り込み、ピザ屋を建物として表示する", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        villageLevel: 3,
        unlockedBuildings: [...playerBuildingIds],
      },
      isBuildMenuOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildMenu)));
    expect(container.textContent).toContain("桜の木");
    expect(container.textContent).not.toContain("ピザ屋");

    const buildingTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("建物"));
    await act(async () => {
      buildingTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("ピザ屋");
    expect(container.textContent).toContain("温泉");
    expect(container.textContent).not.toContain("桜の木");

    const foodTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("食べ物"));
    await act(async () => {
      foodTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("食べ物はまだありません");
    expect(container.textContent).not.toContain("ピザ屋");

    await act(async () => root.unmount());
  });
});
