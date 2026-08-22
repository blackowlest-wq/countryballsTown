import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { useGameStore } from "../src/store/gameStore";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    riceShopPanelBuildingId: null,
    notice: null,
  });
});

describe("rice shop store interaction", () => {
  it("ごはん屋でオムライスを作る", () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        buildings: [{ id: "rice-shop-test", buildingId: "rice-shop", gridX: 8, gridY: 8 }],
        rice: 2,
        tomatoes: 1,
        eggs: 2,
      },
    });

    useGameStore.getState().openRiceShopPanel("rice-shop-test");
    expect(useGameStore.getState().riceShopPanelBuildingId).toBe("rice-shop-test");
    expect(useGameStore.getState().craftShopProduct("rice-shop-test", "omurice", 1)).toBe(true);
    expect(useGameStore.getState().riceShopPanelBuildingId).toBeNull();
    expect(useGameStore.getState().game).toMatchObject({
      rice: 0,
      tomatoes: 0,
      eggs: 0,
      omurice: 1,
    });
    expect(useGameStore.getState().notice).toBe("オムライスを1個作りました！");
  });
});
