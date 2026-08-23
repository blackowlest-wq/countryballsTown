import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { MapTravelPanel } from "../../src/ui/MapTravelPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    isMapTravelOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("MapTravelPanel", () => {
  it("現在地を示し、洞窟を選ぶと移動して閉じる", async () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), currentMap: "sea-and-river" },
      isMapTravelOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(MapTravelPanel)));

    expect(container.textContent).toContain("現在地は海と川");
    expect(container.querySelectorAll("[data-map]")).toHaveLength(3);
    expect(container.querySelector<HTMLButtonElement>('[data-map="sea-and-river"]')?.disabled).toBe(true);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-map="cave"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState()).toMatchObject({
      isMapTravelOpen: false,
      game: { currentMap: "cave" },
      notice: "洞窟へ移動しました。",
    });
    expect(container.querySelector(".map-travel-panel")).toBeNull();

    await act(async () => root.unmount());
  });
});
