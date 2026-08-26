import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { withInventory } from "../inventoryFixture";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    fishShopPanelBuildingId: null,
    notice: null,
  });
});

describe("fish shop store interaction", () => {
  it("魚屋で焼き魚を作り、イワシを消費する", () => {
    useGameStore.setState({
      game: withInventory({
        ...createInitialGameState(0),
        buildings: [{ id: "fish-shop-test", buildingId: "fish-shop", gridX: 8, gridY: 8 }],
      }, { sardine: 1, mackerel: 0, "sea-bream": 0, tuna: 0 }),
    });

    useGameStore.getState().openFishShopPanel("fish-shop-test");
    expect(useGameStore.getState().fishShopPanelBuildingId).toBe("fish-shop-test");
    expect(useGameStore.getState().craftShopProduct("fish-shop-test", "grilled-fish", 1)).toBe(true);
    expect(useGameStore.getState().fishShopPanelBuildingId).toBeNull();
    expect(useGameStore.getState().game).toMatchObject({
      inventory: { "grilled-fish": 1, sardine: 0 },
    });
    expect(useGameStore.getState().notice).toBe("焼き魚を1個作りました！");
  });
});
