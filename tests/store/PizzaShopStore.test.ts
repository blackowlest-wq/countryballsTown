import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { placeBuilding } from "../../src/game/systems/BuildingSystem";
import { useGameStore } from "../../src/store/gameStore";
import { withInventory } from "../inventoryFixture";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    pizzaShopPanelBuildingId: null,
    notice: null,
  });
});

describe("pizza shop store interaction", () => {
  it("ピザ屋で数量と材料を確認してピザを作る", () => {
    const initial = withInventory({
      ...createInitialGameState(0),
      coins: 300,
      unlockedBuildings: [...createInitialGameState(0).unlockedBuildings, "pizza-shop"],
    }, { bacon: 3, cheese: 3, tomato: 3, "wheat-flour": 6 });
    const placed = placeBuilding(initial, "pizza-shop", 12, 12, "pizza-shop-test");
    expect(placed.success).toBe(true);
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });

    useGameStore.getState().openPizzaShopPanel("pizza-shop-test");
    expect(useGameStore.getState().pizzaShopPanelBuildingId).toBe("pizza-shop-test");
    expect(useGameStore.getState().craftPizza("pizza-shop-test", 2)).toBe(true);
    expect(useGameStore.getState().pizzaShopPanelBuildingId).toBeNull();
    expect(useGameStore.getState().game).toMatchObject({
      inventory: { bacon: 1, cheese: 1, tomato: 1, "wheat-flour": 2, pizza: 2 },
    });
    expect(useGameStore.getState().notice).toBe("ピザを2枚作りました！");
  });
});
