import { describe, expect, it } from "vitest";
import { SHOP_VISITOR_SERVICE_MS } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { getProductsForStore } from "../../src/game/data/productCatalog";
import {
  advanceShopVisitors,
  createShopVisitorSimulation,
} from "../../src/game/systems/ShopVisitorSystem";
import { getProductSalePriceForVisitor } from "../../src/game/systems/ProductDemandSystem";
import type { BuildingInstance } from "../../src/game/types/Building";
import type { GameState } from "../../src/game/types/Village";
import { withInventory } from "../inventoryFixture";

const pizzaShop: BuildingInstance = {
  id: "pizza-shop-test",
  buildingId: "pizza-shop",
  gridX: 8,
  gridY: 8,
};

const bakery: BuildingInstance = {
  id: "bakery-test",
  buildingId: "bakery",
  gridX: 8,
  gridY: 8,
};

const fishShop: BuildingInstance = {
  id: "fish-shop-test",
  buildingId: "fish-shop",
  gridX: 8,
  gridY: 8,
};

function stateWithPizzaShop(building = pizzaShop, pizzas = 3): GameState {
  return withInventory({
    ...createInitialGameState(0),
    buildings: [building],
  }, { pizza: pizzas });
}

function dueSimulation() {
  return { ...createShopVisitorSimulation(0), nextArrivalAt: 0 };
}

describe("ShopVisitorSystem", () => {
  it("来客対応する店舗がなければ来訪客を生成しない", () => {
    const result = advanceShopVisitors(createInitialGameState(0), dueSimulation(), 0, 0, () => 0);
    expect(result.simulation.visitors).toHaveLength(0);
  });

  it("ピザ屋へ国旗を持たない単色の来訪客を生成する", () => {
    const result = advanceShopVisitors(stateWithPizzaShop(), dueSimulation(), 0, 0, () => 0);
    expect(result.simulation.visitors).toHaveLength(1);
    expect(result.simulation.visitors[0]).toMatchObject({
      id: "visitor-1",
      shopBuildingId: pizzaShop.id,
      color: "#6fa8dc",
      phase: "arriving",
    });
  });

  it("ピザがないピザ屋には来訪客を生成しない", () => {
    const result = advanceShopVisitors(
      stateWithPizzaShop(pizzaShop, 0),
      dueSimulation(),
      0,
      0,
      () => 0,
    );
    expect(result.simulation.visitors).toHaveLength(0);
  });

  it("店舗ごとの定員を超えて来訪客を生成しない", () => {
    let simulation = dueSimulation();
    for (let index = 0; index < 4; index += 1) {
      const result = advanceShopVisitors(
        stateWithPizzaShop(),
        { ...simulation, nextArrivalAt: index },
        0,
        index,
        () => 0,
      );
      simulation = result.simulation;
    }
    expect(simulation.visitors).toHaveLength(3);
  });

  it("店前で最大3人が重ならずに並び、先頭から購入する", () => {
    let simulation = dueSimulation();
    for (let index = 0; index < 3; index += 1) {
      simulation = advanceShopVisitors(
        stateWithPizzaShop(),
        { ...simulation, nextArrivalAt: index },
        0,
        index,
        () => 0,
      ).simulation;
    }
    simulation = { ...simulation, nextArrivalAt: Number.POSITIVE_INFINITY };

    const queued = advanceShopVisitors(
      stateWithPizzaShop(),
      simulation,
      20_000,
      20_000,
      () => 0,
    ).simulation.visitors;

    expect(queued.map((visitor) => visitor.phase)).toEqual(["buying", "waiting", "waiting"]);
    expect(new Set(queued.map((visitor) => `${visitor.position.x}:${visitor.position.z}`)).size)
      .toBe(3);
  });

  it("購入完了時に売上を付与し、商品を持って退出する", () => {
    const spawned = advanceShopVisitors(
      stateWithPizzaShop(),
      dueSimulation(),
      0,
      0,
      () => 0,
    ).simulation;
    const arrived = advanceShopVisitors(
      stateWithPizzaShop(),
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;
    const purchased = advanceShopVisitors(
      stateWithPizzaShop(),
      arrived,
      0,
      20_000 + SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );

    expect(purchased.coinsEarned).toBe(
      getProductSalePriceForVisitor(
        "pizza",
        "poland",
        20_000 + SHOP_VISITOR_SERVICE_MS,
        getProductsForStore("pizza-shop"),
      ),
    );
    expect(purchased.pizzasSold).toBe(1);
    expect(purchased.simulation.visitors[0].phase).toBe("leaving");

    const exited = advanceShopVisitors(
      stateWithPizzaShop(),
      purchased.simulation,
      20_000,
      40_000 + SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );
    expect(exited.simulation.visitors).toHaveLength(0);
  });

  it("店舗を移動すると購入を中断し、新しい店前へ向かう", () => {
    const state = stateWithPizzaShop();
    const spawned = advanceShopVisitors(state, dueSimulation(), 0, 0, () => 0).simulation;
    const arrived = advanceShopVisitors(
      state,
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;
    const previousDestination = arrived.visitors[0].destination;
    const movedState = stateWithPizzaShop({ ...pizzaShop, gridX: 3, gridY: 3 });

    const moved = advanceShopVisitors(movedState, arrived, 0, 20_001, () => 0);
    expect(moved.simulation.visitors[0].phase).toBe("arriving");
    expect(moved.simulation.visitors[0].serviceUntil).toBeUndefined();
    expect(moved.simulation.visitors[0].destination).not.toEqual(previousDestination);
  });

  it("店舗を撤去すると購入を成立させず、全員を退出させる", () => {
    const state = stateWithPizzaShop();
    const spawned = advanceShopVisitors(state, dueSimulation(), 0, 0, () => 0).simulation;
    const arrived = advanceShopVisitors(
      state,
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;
    const removedState = { ...state, buildings: [] };

    const leaving = advanceShopVisitors(
      removedState,
      arrived,
      0,
      20_000 + SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );
    expect(leaving.coinsEarned).toBe(0);
    expect(leaving.simulation.visitors[0].phase).toBe("leaving");

    const exited = advanceShopVisitors(
      removedState,
      leaving.simulation,
      20_000,
      40_000 + SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );
    expect(exited.simulation.visitors).toHaveLength(0);
  });

  it("パン屋は在庫のあるパン商品を来訪客へ販売する", () => {
    const state = withInventory({
      ...createInitialGameState(0),
      buildings: [bakery],
    }, { bread: 1, "hot-dog": 1 });
    const spawned = advanceShopVisitors(
      state,
      dueSimulation(),
      0,
      0,
      () => 0,
    ).simulation;
    const arrived = advanceShopVisitors(
      state,
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;
    const purchased = advanceShopVisitors(
      state,
      arrived,
      0,
      20_000 + SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );

    expect(purchased.productsSold).toEqual({ bread: 1 });
    expect(purchased.coinsEarned).toBe(
      getProductSalePriceForVisitor(
        "bread",
        "poland",
        20_000 + SHOP_VISITOR_SERVICE_MS,
        getProductsForStore("bakery"),
      ),
    );
  });

  it("魚屋は在庫のある魚料理を来訪客へ販売する", () => {
    const state = withInventory({
      ...createInitialGameState(0),
      buildings: [fishShop],
    }, { "grilled-fish": 1 });
    const spawned = advanceShopVisitors(
      state,
      dueSimulation(),
      0,
      0,
      () => 0,
    ).simulation;
    const arrived = advanceShopVisitors(
      state,
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;
    const purchased = advanceShopVisitors(
      state,
      arrived,
      0,
      20_000 + SHOP_VISITOR_SERVICE_MS,
      () => 0,
    );

    expect(purchased.productsSold).toEqual({ "grilled-fish": 1 });
    expect(purchased.coinsEarned).toBe(
      getProductSalePriceForVisitor(
        "grilled-fish",
        "poland",
        20_000 + SHOP_VISITOR_SERVICE_MS,
        getProductsForStore("fish-shop"),
      ),
    );
  });

  it("店舗インスタンスの強化を行列上限と接客時間へ適用する", () => {
    const state = {
      ...stateWithPizzaShop(pizzaShop, 5),
      buildingUpgrades: {
        [pizzaShop.id]: {
          "sale-speed": 1 as const,
          "queue-capacity": 1 as const,
        },
      },
    };
    let simulation = dueSimulation();
    for (let index = 0; index < 4; index += 1) {
      simulation = advanceShopVisitors(
        state,
        { ...simulation, nextArrivalAt: index },
        0,
        index,
        () => 0,
      ).simulation;
    }
    expect(simulation.visitors).toHaveLength(4);

    const spawned = advanceShopVisitors(state, dueSimulation(), 0, 0, () => 0).simulation;
    const arrived = advanceShopVisitors(
      state,
      { ...spawned, nextArrivalAt: Number.POSITIVE_INFINITY },
      20_000,
      20_000,
      () => 0,
    ).simulation;
    const purchased = advanceShopVisitors(
      state,
      arrived,
      0,
      20_000 + 4_080,
      () => 0,
    );
    expect(purchased.productsSold).toEqual({ pizza: 1 });
  });
});
