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
    expect(container.textContent).toContain("牛乳工場");
    expect(container.textContent).toContain("豚肉工場");
    expect(container.textContent).not.toContain("桜の木");
    expect([...container.querySelectorAll('[role="tab"]')]
      .some((tab) => tab.textContent?.includes("食べ物"))).toBe(false);

    const natureTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("自然"));
    await act(async () => {
      natureTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("桜の木");
    expect(container.textContent).toContain("牛");
    expect(container.textContent).toContain("豚");
    expect(container.textContent).toContain("鶏");
    expect(container.textContent).not.toContain("ピザ屋");

    const buildingTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("建物"));
    await act(async () => {
      buildingTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("牛乳工場");
    expect(container.textContent).toContain("ピザ屋");
    expect(container.textContent).toContain("柵");
    expect(container.textContent).toContain("道路");

    await act(async () => root.unmount());
  });

  it("家畜が5頭いると家畜の建築ボタンを無効にする", async () => {
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        villageLevel: 3,
        unlockedBuildings: [...playerBuildingIds],
        buildings: [
          { id: "cow-1", buildingId: "cow", gridX: 1, gridY: 1 },
          { id: "pig-1", buildingId: "pig", gridX: 3, gridY: 1 },
          { id: "chicken-1", buildingId: "chicken", gridX: 5, gridY: 1 },
          { id: "cow-2", buildingId: "cow", gridX: 7, gridY: 1 },
          { id: "pig-2", buildingId: "pig", gridX: 9, gridY: 1 },
        ],
      },
      isBuildMenuOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BuildMenu)));
    const natureTab = [...container.querySelectorAll('[role="tab"]')]
      .find((tab) => tab.textContent?.includes("自然"));
    await act(async () => {
      natureTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("家畜: 5 / 5");
    for (const name of ["牛", "豚", "鶏"]) {
      const button = [...container.querySelectorAll("button")]
        .find((candidate) => candidate.textContent?.includes(name));
      expect(button).toBeDefined();
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }

    await act(async () => root.unmount());
  });
});
