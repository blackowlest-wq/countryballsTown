import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { createShopVisitorSimulation } from "../../src/game/systems/ShopVisitorSystem";
import { useGameStore } from "../../src/store/gameStore";

afterEach(() => {
  vi.restoreAllMocks();
  useGameStore.setState({
    game: createInitialGameState(0),
    economyRemainderMs: 0,
    visitorSimulation: createShopVisitorSimulation(0),
    interactionMode: "inspect",
    selectedCropType: "wheat",
    notice: null,
  });
});

describe("gameStore adapter", () => {
  it("通常のゲーム更新では保存境界のrepairを実行しない", () => {
    const orphanedCowProduction = { buildingInstanceId: "removed-cow", milkReadyAt: 1_000 };
    const game = {
      ...createInitialGameState(0),
      buildings: [{ id: "field-test", buildingId: "field", gridX: 8, gridY: 8 }],
      cowProductions: [orphanedCowProduction],
    };
    useGameStore.setState({ game, interactionMode: "farm", selectedCropType: "wheat" });

    expect(useGameStore.getState().interactCrop(8, 8, 0)).toBe("planted");
    expect(useGameStore.getState().game.cowProductions).toEqual([orphanedCowProduction]);
  });

  it("tickの進行結果をStoreへ反映する", () => {
    useGameStore.setState({
      game: createInitialGameState(0),
      economyRemainderMs: 400,
      visitorSimulation: createShopVisitorSimulation(0),
    });

    useGameStore.getState().tick(500, 500);

    expect(useGameStore.getState().economyRemainderMs).toBe(900);
  });

  it("即時保存が必要なtickでは保存境界のcanonical stateをStoreへ反映する", () => {
    const game = {
      ...createInitialGameState(0),
      residents: [],
      nextResidentRequestAt: Number.POSITIVE_INFINITY,
      buildings: [{ id: "milk-factory-test", buildingId: "milk-factory", gridX: 8, gridY: 8 }],
      milk: 1,
      milkFactoryProductions: [{
        buildingInstanceId: "milk-factory-test",
        productType: "butter" as const,
        nextProductionAt: 20_000,
      }],
      cowProductions: [{ buildingInstanceId: "orphan-cow", milkReadyAt: 1_000 }],
    };
    useGameStore.setState({
      game,
      economyRemainderMs: 0,
      visitorSimulation: createShopVisitorSimulation(0),
    });
    vi.spyOn(Date, "now").mockReturnValue(50_000);

    useGameStore.getState().tick(0, 20_000);

    expect(useGameStore.getState().game).toMatchObject({
      butter: 3,
      cowProductions: [],
      lastSavedAt: 50_000,
    });
  });
});
