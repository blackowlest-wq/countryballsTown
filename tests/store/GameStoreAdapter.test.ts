import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { MAX_COINS, SHOP_VISITOR_SERVICE_MS } from "../../src/game/constants/gameConstants";
import { createShopVisitorSimulation } from "../../src/game/systems/ShopVisitorSystem";
import { useGameStore } from "../../src/store/gameStore";
import type { ShopVisitor } from "../../src/game/types/ShopVisitor";

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

  it("ショップ販売の売上をStoreのコインへ反映する", () => {
    const pizzaShop = {
      id: "pizza-shop-test",
      buildingId: "pizza-shop",
      gridX: 8,
      gridY: 8,
    } as const;
    const visitor: ShopVisitor = {
      id: "visitor-test",
      shopBuildingId: pizzaShop.id,
      color: "#6fa8dc",
      position: { x: 10, z: 10 },
      destination: { x: 10, z: 10 },
      phase: "buying",
      joinedAt: 0,
      serviceUntil: SHOP_VISITOR_SERVICE_MS,
    };
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        residents: [],
        nextResidentRequestAt: Number.POSITIVE_INFINITY,
        buildings: [pizzaShop],
        pizzas: 1,
      },
      visitorSimulation: {
        visitors: [visitor],
        nextArrivalAt: Number.POSITIVE_INFINITY,
        nextSequence: 2,
      },
    });

    useGameStore.getState().tick(0, SHOP_VISITOR_SERVICE_MS);

    expect(useGameStore.getState().game).toMatchObject({ coins: 103, pizzas: 0 });
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

  it("デバッグ操作で所持コインを上限へ設定する", () => {
    useGameStore.setState({ game: { ...createInitialGameState(0), coins: 321 } });

    useGameStore.getState().grantMaxCoinsForDevelopment();

    expect(useGameStore.getState().game.coins).toBe(MAX_COINS);
    expect(useGameStore.getState().notice).toContain("10,000");
  });

  it("ゲーム状況を初期状態へリセットし、進行用UI状態も閉じる", () => {
    vi.spyOn(Date, "now").mockReturnValue(50_000);
    useGameStore.setState({
      game: { ...createInitialGameState(0), coins: MAX_COINS, villageLevel: 3 },
      economyRemainderMs: 700,
      interactionMode: "farm",
      selectedCropType: "tomato",
      selectedBuildingId: "tree-1",
      isBuildMenuOpen: true,
      isResidentPanelOpen: true,
      isMapTravelOpen: true,
      isEncyclopediaOpen: true,
      isFishingPromptOpen: true,
      isFishingGameOpen: true,
      isCaveMiningGameOpen: true,
    });

    useGameStore.getState().resetGame();

    const state = useGameStore.getState();
    expect(state.game).toMatchObject({ coins: 100, villageLevel: 1, lastSavedAt: 50_000 });
    expect(state.economyRemainderMs).toBe(0);
    expect(state.interactionMode).toBe("inspect");
    expect(state.selectedCropType).toBe("wheat");
    expect(state.selectedBuildingId).toBeNull();
    expect(state.isBuildMenuOpen).toBe(false);
    expect(state.isResidentPanelOpen).toBe(false);
    expect(state.isMapTravelOpen).toBe(false);
    expect(state.isEncyclopediaOpen).toBe(false);
    expect(state.isFishingPromptOpen).toBe(false);
    expect(state.isFishingGameOpen).toBe(false);
    expect(state.isCaveMiningGameOpen).toBe(false);
    expect(state.notice).toBe("新しい村を始めました。");
  });
});
