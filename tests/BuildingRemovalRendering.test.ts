// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  placeBuilding,
  removeBuilding,
} from "../src/game/systems/BuildingSystem";
import type { GameState } from "../src/game/types/Village";
import { BuildingRenderer } from "../src/scene/buildings/BuildingRenderer";
import { useGameStore } from "../src/store/gameStore";

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}));

function placeOrThrow(
  state: GameState,
  buildingId: string,
  gridX: number,
  gridY: number,
): GameState {
  const result = placeBuilding(state, buildingId, gridX, gridY);
  if (!result.success) throw new Error(`Could not place ${buildingId}: ${result.reason}`);
  return result.state;
}

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    selectedResidentId: null,
    notice: null,
  });
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("BuildingRenderer", () => {
  it("重複IDを含む旧データから木を撤去しても表示を残さない", async () => {
    const tree = {
      id: "legacy-duplicate",
      buildingId: "tree",
      gridX: 12,
      gridY: 12,
    };
    const flower = {
      id: "legacy-duplicate",
      buildingId: "flower",
      gridX: 2,
      gridY: 10,
    };
    const torii = {
      id: "legacy-tail",
      buildingId: "torii",
      gridX: 16,
      gridY: 12,
    };
    const game: GameState = {
      ...createInitialGameState(0),
      villageLevel: 3,
      unlockedBuildings: ["tree", "flower", "torii"],
      buildings: [tree, flower, torii],
    };

    useGameStore.setState({ game });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    const renderedTree = container.firstElementChild?.children[0];
    expect(renderedTree).toBeInstanceOf(Element);

    await act(async () => {
      useGameStore.setState({
        game: { ...game, buildings: [torii] },
        notice: "建物を撤去しました。",
      });
    });

    expect(renderedTree?.isConnected).toBe(false);
    expect(container.firstElementChild?.children).toHaveLength(1);
    await act(async () => root.unmount());
  });

  it("撤去済みの温泉をWebGLツリーに残さない", async () => {
    let game: GameState = {
      ...createInitialGameState(0),
      coins: 1_000,
      villageLevel: 3,
      unlockedBuildings: ["tree", "flower", "onsen"],
    };
    game = placeOrThrow(game, "onsen", 12, 12);
    game = removeBuilding(game, "tree-1").state;
    game = placeOrThrow(game, "flower", 2, 10);
    game = placeOrThrow(game, "tree", 2, 12);

    useGameStore.setState({ game, selectedBuildingId: "building-5" });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    expect(container.querySelector('group[position="3.5,0,3"]')).not.toBeNull();
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("building-5");

    await act(async () => {
      expect(useGameStore.getState().removeSelectedBuilding()).toBe(true);
    });

    expect(useGameStore.getState().game.buildings.some((item) => item.buildingId === "onsen"))
      .toBe(false);
    expect(container.querySelector('group[position="3.5,0,3"]')).toBeNull();
    await act(async () => root.unmount());
  });

  it.each(["field", "tree", "cherry-tree", "flower", "onsen", "torii", "pizza-shop"])(
    "重複IDを含む旧データでも%sを別の建物へ変えずに移動する",
    async (targetBuildingId) => {
      const conflictingBuildingId = targetBuildingId === "flower" ? "tree" : "flower";
      const conflictingBuilding = {
        id: "legacy-duplicate",
        buildingId: conflictingBuildingId,
        gridX: 2,
        gridY: 10,
      };
      const targetBuilding = {
        id: "legacy-duplicate",
        buildingId: targetBuildingId,
        gridX: 12,
        gridY: 12,
      };
      const game: GameState = {
        ...createInitialGameState(0),
        coins: 1_000,
        villageLevel: 3,
        unlockedBuildings: [
          "field",
          "tree",
          "cherry-tree",
          "flower",
          "onsen",
          "torii",
          "pizza-shop",
        ],
        buildings: [conflictingBuilding, targetBuilding],
      };

      useGameStore.setState({ game });
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      await act(async () => root.render(createElement(BuildingRenderer)));
      const targetGroup = container.firstElementChild?.children[1];
      expect(targetGroup).toBeInstanceOf(Element);
      await act(async () => {
        targetGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      const selectedId = useGameStore.getState().selectedBuildingId;
      expect(selectedId).not.toBeNull();
      await act(async () => useGameStore.getState().beginMove(selectedId ?? ""));
      await act(async () => {
        expect(useGameStore.getState().moveSelectedBuilding(12, 16)).toBe(true);
      });

      const buildings = useGameStore.getState().game.buildings;
      expect(buildings).toHaveLength(2);
      expect(new Set(buildings.map((building) => building.id)).size).toBe(2);
      expect(buildings.find((building) => building.buildingId === targetBuildingId))
        .toMatchObject({ gridX: 12, gridY: 16 });
      expect(buildings.find((building) => building.buildingId === conflictingBuildingId))
        .toMatchObject({ gridX: 2, gridY: 10 });
      await act(async () => root.unmount());
    },
  );
});
