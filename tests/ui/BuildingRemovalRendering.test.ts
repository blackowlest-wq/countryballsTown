
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  placeBuilding,
  removeBuilding,
} from "../../src/game/systems/BuildingSystem";
import type { GameState } from "../../src/game/types/Village";
import { BuildingRenderer } from "../../src/scene/buildings/BuildingRenderer";
import { useGameStore } from "../../src/store/gameStore";

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
    milkFactoryPanelBuildingId: null,
    porkFactoryPanelBuildingId: null,
    selectedResidentId: null,
    notice: null,
  });
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("BuildingRenderer", () => {
  it("採乳可能な牛へマークを出し、タップで牛乳を受け取る", async () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "cow",
      8,
      8,
      "cow-test",
      0,
    );
    const game = {
      ...placed.state,
      cowProductions: [{ buildingInstanceId: "cow-test", milkReadyAt: 0 }],
    };
    useGameStore.setState({ game });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    expect(container.querySelector('[name="牛乳を収穫できます"]')).not.toBeNull();
    const cowGroup = container.firstElementChild?.lastElementChild;

    await act(async () => {
      cowGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.milk).toBe(2);
    expect(container.querySelector('[name="牛乳を収穫できます"]')).toBeNull();
    await act(async () => root.unmount());
  });

  it("豚肉を収穫できる豚へマークを出し、タップしても豚を残す", async () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "pig",
      8,
      8,
      "pig-test",
      0,
    );
    const game = {
      ...placed.state,
      pigProductions: [{ buildingInstanceId: "pig-test", porkReadyAt: 0 }],
    };
    useGameStore.setState({ game });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    expect(container.querySelector('[name="豚肉を収穫できます"]')).not.toBeNull();
    const pigGroup = container.firstElementChild?.lastElementChild;

    await act(async () => {
      pigGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.pork).toBe(2);
    expect(useGameStore.getState().game.buildings).toContainEqual({
      id: "pig-test",
      buildingId: "pig",
      gridX: 8,
      gridY: 8,
    });
    expect(container.querySelector('[name="豚肉を収穫できます"]')).toBeNull();
    await act(async () => root.unmount());
  });

  it("卵を収穫できる鶏へマークを出し、タップすると卵を受け取る", async () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "chicken",
      8,
      8,
      "chicken-test",
      0,
    );
    const game = {
      ...placed.state,
      chickenProductions: [{ buildingInstanceId: "chicken-test", eggReadyAt: 0 }],
    };
    useGameStore.setState({ game });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    expect(container.querySelector('[name="卵を収穫できます"]')).not.toBeNull();
    const chickenGroup = container.firstElementChild?.lastElementChild;

    await act(async () => {
      chickenGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.eggs).toBe(2);
    expect(container.querySelector('[name="卵を収穫できます"]')).toBeNull();
    await act(async () => root.unmount());
  });

  it("未設定の豚肉工場をタップすると設定パネルを開く", async () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "pork-factory",
      8,
      8,
      "pork-factory-test",
      0,
    );
    useGameStore.setState({ game: placed.state });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    const factoryGroup = container.firstElementChild?.lastElementChild;
    await act(async () => {
      factoryGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().porkFactoryPanelBuildingId).toBe("pork-factory-test");
    await act(async () => root.unmount());
  });

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

  it("鳥居を選択して撤去するとWebGLツリーから消える", async () => {
    const torii = {
      id: "torii-test",
      buildingId: "torii",
      gridX: 12,
      gridY: 12,
    };
    const game: GameState = {
      ...createInitialGameState(0),
      villageLevel: 3,
      unlockedBuildings: ["torii"],
      buildings: [torii],
    };

    useGameStore.setState({ game });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    const toriiGroup = container.firstElementChild?.firstElementChild;
    expect(toriiGroup).toBeInstanceOf(Element);

    await act(async () => {
      toriiGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().selectedBuildingId).toBe("torii-test");

    await act(async () => {
      expect(useGameStore.getState().removeSelectedBuilding()).toBe(true);
    });

    expect(useGameStore.getState().game.buildings).toEqual([]);
    expect(toriiGroup?.isConnected).toBe(false);
    expect(container.firstElementChild?.children).toHaveLength(0);
    await act(async () => root.unmount());
  });

  it("鳥居を移動した直後に撤去しても表示を残さない", async () => {
    const torii = {
      id: "torii-test",
      buildingId: "torii",
      gridX: 12,
      gridY: 12,
    };
    const game: GameState = {
      ...createInitialGameState(0),
      villageLevel: 3,
      unlockedBuildings: ["torii"],
      buildings: [torii],
    };

    useGameStore.setState({ game });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => root.render(createElement(BuildingRenderer)));
    const toriiGroup = container.firstElementChild?.firstElementChild;
    await act(async () => {
      toriiGroup?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => useGameStore.getState().beginMove("torii-test"));
    await act(async () => {
      expect(useGameStore.getState().moveSelectedBuilding(14, 14)).toBe(true);
    });
    expect(container.querySelector('group[position="4.5,0,4.5"]')).not.toBeNull();

    await act(async () => {
      expect(useGameStore.getState().removeSelectedBuilding()).toBe(true);
    });

    expect(container.querySelector('group[position="4.5,0,4.5"]')).toBeNull();
    expect(container.firstElementChild?.children).toHaveLength(0);
    await act(async () => root.unmount());
  });

  it("重複IDを含む旧データから先頭の建物を撤去した後も鳥居の位置を正しく描画する", async () => {
    const tree = {
      id: "legacy-duplicate",
      buildingId: "tree",
      gridX: 12,
      gridY: 12,
    };
    const torii = {
      id: "legacy-duplicate",
      buildingId: "torii",
      gridX: 2,
      gridY: 10,
    };
    const game: GameState = {
      ...createInitialGameState(0),
      villageLevel: 3,
      unlockedBuildings: ["tree", "torii"],
      buildings: [tree, torii],
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
      useGameStore.setState({ game: { ...game, buildings: [torii] } });
    });

    expect(renderedTree?.isConnected).toBe(false);
    expect(container.querySelector('group[position="-7.5,0,0.5"]')).not.toBeNull();
    await act(async () => root.unmount());
  });

  it.each(["field", "fence", "road", "cow", "pig", "chicken", "tree", "cherry-tree", "flower", "onsen", "torii", "pizza-shop"])(
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
          "fence",
          "road",
          "cow",
          "pig",
          "chicken",
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
