import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { SHOP_VISITOR_SERVICE_MS } from "../../src/game/constants/gameConstants";
import { advanceGameProgress, type GameProgressState } from "../../src/game/systems/GameProgressSystem";
import { createShopVisitorSimulation } from "../../src/game/systems/ShopVisitorSystem";
import type { ShopVisitor } from "../../src/game/types/ShopVisitor";

function progressState(overrides: Partial<GameProgressState> = {}): GameProgressState {
  return {
    game: {
      ...createInitialGameState(0),
      residents: [],
      nextResidentRequestAt: Number.POSITIVE_INFINITY,
      ...overrides.game,
    },
    economyRemainderMs: 0,
    visitorSimulation: createShopVisitorSimulation(0),
    ...overrides,
  };
}

describe("GameProgressSystem", () => {
  it("経済の端数時間を保持し、通常tickでは保存を要求しない", () => {
    const current = progressState({ economyRemainderMs: 400 });

    const result = advanceGameProgress(current, 500, 500, () => 0);

    expect(result.game.coins).toBe(100);
    expect(result.economyRemainderMs).toBe(900);
    expect(result.notice).toBeNull();
    expect(result.shouldPersist).toBe(false);
  });

  it("工場の生産を進め、変更があれば即時保存を要求する", () => {
    const current = progressState({
      game: {
        ...createInitialGameState(0),
        residents: [],
        nextResidentRequestAt: Number.POSITIVE_INFINITY,
        milk: 1,
        buildings: [{ id: "milk-factory-test", buildingId: "milk-factory", gridX: 8, gridY: 8 }],
        milkFactoryProductions: [{
          buildingInstanceId: "milk-factory-test",
          productType: "butter",
          nextProductionAt: 20_000,
        }],
      },
    });

    const result = advanceGameProgress(current, 0, 20_000, () => 0);

    expect(result.game).toMatchObject({ milk: 0, butter: 3 });
    expect(result.shouldPersist).toBe(true);
  });

  it("来訪客の販売と在庫消費を同じtickで反映する", () => {
    const pizzaShop = { id: "pizza-shop-test", buildingId: "pizza-shop", gridX: 8, gridY: 8 } as const;
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
    const current = progressState({
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

    const result = advanceGameProgress(
      current,
      0,
      SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );

    expect(result.game).toMatchObject({ coins: 100.3, pizzas: 0 });
    expect(result.visitorSimulation.visitors[0].phase).toBe("leaving");
    expect(result.shouldPersist).toBe(true);
  });

  it("村の進行イベントを通知へ変換し、保存を要求する", () => {
    const current = progressState({
      game: {
        ...createInitialGameState(0),
        buildings: [
          ...createInitialGameState(0).buildings,
          { id: "tree-3", buildingId: "tree", gridX: 8, gridY: 2 },
          { id: "flower-1", buildingId: "flower", gridX: 8, gridY: 4 },
          { id: "flower-2", buildingId: "flower", gridX: 9, gridY: 4 },
          { id: "flower-3", buildingId: "flower", gridX: 10, gridY: 4 },
        ],
      },
    });

    const result = advanceGameProgress(current, 0, 0, () => 0);

    expect(result.notice).toContain("レベル2");
    expect(result.game.villageLevel).toBe(2);
    expect(result.shouldPersist).toBe(true);
  });

  it("注入した時刻と乱数で同じ入力から同じ進行結果を返す", () => {
    const current = progressState({
      game: {
        ...createInitialGameState(0),
        nextResidentRequestAt: 0,
        residentRequestsStartedToday: 0,
        activeResidentRequest: null,
        lastResidentRequestDefinitionId: undefined,
      },
    });
    const run = () => {
      let randomCalls = 0;
      const result = advanceGameProgress(current, 0, 0, () => {
        randomCalls += 1;
        return 0.1;
      });
      return { result, randomCalls };
    };

    const first = run();
    const second = run();

    expect(first.randomCalls).toBeGreaterThan(0);
    expect(first.randomCalls).toBe(second.randomCalls);
    expect(first.result.game.activeResidentRequest).toMatchObject({
      definitionId: "poland-flower-field",
      residentId: "resident-poland",
    });
    expect(first.result.notice).toContain("お願い");
    expect(first.result.shouldPersist).toBe(true);
    expect(second.result).toEqual(first.result);
  });
});
