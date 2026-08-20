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
  it("最初に畑を表示し、カテゴリで建築物を絞り込む", async () => {
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
    expect(container.textContent).toContain("畑");
    expect(container.textContent).toContain("ピザ屋");
    expect(container.textContent).not.toContain("桜の木");

    const natureTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("自然"));
    await act(async () => {
      natureTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("桜の木");
    expect(container.textContent).toContain("牛");
    expect(container.textContent).not.toContain("ピザ屋");

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
