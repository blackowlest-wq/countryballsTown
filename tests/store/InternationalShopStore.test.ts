import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { withInventory } from "../inventoryFixture";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    chineseRestaurantPanelBuildingId: null,
    burgerShopPanelBuildingId: null,
    notice: null,
  });
});

describe("国別店舗のStore接続", () => {
  it("中華食堂でチャーハンを作れる", () => {
    const building = {
      id: "chinese-restaurant-test",
      buildingId: "chinese-restaurant",
      gridX: 8,
      gridY: 8,
    } as const;
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [building],
      }, { rice: 1, eggs: 1 }),
    });

    useGameStore.getState().openChineseRestaurantPanel(building.id);
    expect(useGameStore.getState().chineseRestaurantPanelBuildingId).toBe(building.id);
    expect(useGameStore.getState().craftShopProduct(building.id, "fried-rice", 1)).toBe(true);
    expect(useGameStore.getState().game.inventory).toMatchObject({
      rice: 0,
      eggs: 0,
      "fried-rice": 1,
    });
  });

  it("中華食堂で餃子を作れる", () => {
    const building = {
      id: "chinese-restaurant-dumplings-test",
      buildingId: "chinese-restaurant",
      gridX: 8,
      gridY: 8,
    } as const;
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [building],
      }, { "wheat-flour": 1, pork: 1 }),
    });

    expect(useGameStore.getState().craftShopProduct(building.id, "dumplings", 1)).toBe(true);
    expect(useGameStore.getState().game.inventory).toMatchObject({
      "wheat-flour": 0,
      pork: 0,
      dumplings: 1,
    });
  });

  it("ハンバーガーショップでハンバーガーを作れる", () => {
    const building = {
      id: "burger-shop-test",
      buildingId: "burger-shop",
      gridX: 8,
      gridY: 8,
    } as const;
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [building],
      }, { "wheat-flour": 1, pork: 1 }),
    });

    useGameStore.getState().openBurgerShopPanel(building.id);
    expect(useGameStore.getState().burgerShopPanelBuildingId).toBe(building.id);
    expect(useGameStore.getState().craftShopProduct(building.id, "hamburger", 1)).toBe(true);
    expect(useGameStore.getState().game.inventory).toMatchObject({
      "wheat-flour": 0,
      pork: 0,
      hamburger: 1,
    });
  });

  it("ハンバーガーショップでパンケーキを作れる", () => {
    const building = {
      id: "burger-shop-pancakes-test",
      buildingId: "burger-shop",
      gridX: 8,
      gridY: 8,
    } as const;
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [building],
      }, { "wheat-flour": 1, eggs: 1, butter: 1 }),
    });

    expect(useGameStore.getState().craftShopProduct(building.id, "pancakes", 1)).toBe(true);
    expect(useGameStore.getState().game.inventory).toMatchObject({
      "wheat-flour": 0,
      eggs: 0,
      butter: 0,
      pancakes: 1,
    });
  });
});
