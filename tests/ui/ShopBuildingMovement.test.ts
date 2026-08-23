
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { placeBuilding } from "../../src/game/systems/BuildingSystem";
import type { GameState } from "../../src/game/types/Village";
import { BuildingRenderer } from "../../src/scene/buildings/BuildingRenderer";
import { useGameStore } from "../../src/store/gameStore";

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}));

const shopCases = [
  { buildingId: "pizza-shop", panelKey: "pizzaShopPanelBuildingId" },
  { buildingId: "bakery", panelKey: "bakeryPanelBuildingId" },
  { buildingId: "rice-shop", panelKey: "riceShopPanelBuildingId" },
  { buildingId: "fish-shop", panelKey: "fishShopPanelBuildingId" },
] as const;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    pizzaShopPanelBuildingId: null,
    bakeryPanelBuildingId: null,
    riceShopPanelBuildingId: null,
    fishShopPanelBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("店舗の移動操作", () => {
  it.each(shopCases)("$buildingIdをタップして移動できる", async ({ buildingId, panelKey }) => {
    const initial = createInitialGameState(0);
    const state: GameState = {
      ...initial,
      coins: 1_000,
      buildings: [],
      unlockedBuildings: [...new Set([...initial.unlockedBuildings, buildingId])],
    };
    const placed = placeBuilding(state, buildingId, 12, 12, `${buildingId}-test`);
    expect(placed.success).toBe(true);
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    const shopGroup = container.firstElementChild?.firstElementChild;
    expect(shopGroup).toBeInstanceOf(Element);

    await act(async () => {
      shopGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().selectedBuildingId).toBe(`${buildingId}-test`);
    expect(useGameStore.getState()[panelKey]).toBeNull();

    await act(async () => useGameStore.getState().beginMove(`${buildingId}-test`));
    expect(useGameStore.getState().interactionMode).toBe("move");
    await act(async () => {
      expect(useGameStore.getState().moveSelectedBuilding(14, 14)).toBe(true);
    });
    expect(useGameStore.getState().game.buildings).toContainEqual({
      id: `${buildingId}-test`,
      buildingId,
      gridX: 14,
      gridY: 14,
    });

    await act(async () => root.unmount());
  });
});
