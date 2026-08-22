import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    bakeryPanelBuildingId: null,
    notice: null,
  });
});

describe("bakery store interaction", () => {
  it("パン屋でホットドックを作る", () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        buildings: [{ id: "bakery-test", buildingId: "bakery", gridX: 8, gridY: 8 }],
        wheatFlour: 1,
        sausage: 1,
      },
    });

    expect(useGameStore.getState().craftShopProduct("bakery-test", "hot-dog", 1)).toBe(true);
    expect(useGameStore.getState().game).toMatchObject({
      wheatFlour: 0,
      sausage: 0,
      hotDogs: 1,
    });
    expect(useGameStore.getState().notice).toBe("ホットドックを1個作りました！");
  });
});
