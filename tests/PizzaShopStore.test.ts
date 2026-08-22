import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { placeBuilding } from "../src/game/systems/BuildingSystem";
import { useGameStore } from "../src/store/gameStore";

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
    const initial = {
      ...createInitialGameState(0),
      coins: 300,
      bacon: 3,
      cheese: 3,
      tomatoes: 3,
      wheatFlour: 6,
      unlockedBuildings: [...createInitialGameState(0).unlockedBuildings, "pizza-shop"],
    };
    const placed = placeBuilding(initial, "pizza-shop", 12, 12, "pizza-shop-test");
    expect(placed.success).toBe(true);
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });

    useGameStore.getState().openPizzaShopPanel("pizza-shop-test");
    expect(useGameStore.getState().pizzaShopPanelBuildingId).toBe("pizza-shop-test");
    expect(useGameStore.getState().craftPizza("pizza-shop-test", 2)).toBe(true);
    expect(useGameStore.getState().pizzaShopPanelBuildingId).toBeNull();
    expect(useGameStore.getState().game).toMatchObject({
      bacon: 1,
      cheese: 1,
      tomatoes: 1,
      wheatFlour: 2,
      pizzas: 2,
    });
    expect(useGameStore.getState().notice).toBe("ピザを2枚作りました！");
  });
});
