import { afterEach, describe, expect, it } from "vitest";
import { SHOP_VISITOR_SERVICE_MS } from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  advanceShopVisitors,
  createShopVisitorSimulation,
} from "../src/game/systems/ShopVisitorSystem";
import type { BuildingInstance } from "../src/game/types/Building";
import { useGameStore } from "../src/store/gameStore";

const pizzaShop: BuildingInstance = {
  id: "pizza-shop-store-test",
  buildingId: "pizza-shop",
  gridX: 8,
  gridY: 8,
};

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    economyRemainderMs: 0,
    visitorSimulation: createShopVisitorSimulation(0),
  });
});

describe("gameStore shop visitors", () => {
  it("来訪客の購入売上を村のコインへ反映する", () => {
    const game = {
      ...createInitialGameState(0),
      buildings: [pizzaShop],
      pizzas: 1,
      nextResidentRequestAt: Number.POSITIVE_INFINITY,
    };
    const spawned = advanceShopVisitors(
      game,
      { ...createShopVisitorSimulation(0), nextArrivalAt: 0 },
      0,
      0,
      () => 0,
    ).simulation;
    const arrived = advanceShopVisitors(
      game,
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;

    useGameStore.setState({ game, economyRemainderMs: 0, visitorSimulation: arrived });
    useGameStore.getState().tick(0, 20_000 + SHOP_VISITOR_SERVICE_MS);

    expect(useGameStore.getState().game.coins).toBe(game.coins + 3);
    expect(useGameStore.getState().game.pizzas).toBe(0);
    expect(useGameStore.getState().visitorSimulation.visitors[0].phase).toBe("leaving");
  });
});
