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
    milkFactoryPanelBuildingId: null,
    notice: null,
  });
});

describe("milk factory store interaction", () => {
  it("工場で作るものを選ぶと20秒後から牛乳1個で加工物を3個生産する", () => {
    const placed = placeBuilding(
      withInventory(createInitialGameState(0), { milk: 1 }),
      "milk-factory",
      8,
      8,
      "factory-test",
    );
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });

    useGameStore.getState().openMilkFactoryPanel("factory-test");
    expect(useGameStore.getState().milkFactoryPanelBuildingId).toBe("factory-test");
    expect(useGameStore.getState().configureMilkFactory("factory-test", "butter", 0))
      .toBe(true);
    expect(useGameStore.getState().milkFactoryPanelBuildingId).toBeNull();
    expect(useGameStore.getState().game.milkFactoryProductions[0]).toMatchObject({
      productType: "butter",
      nextProductionAt: 20_000,
    });

    useGameStore.getState().tick(0, 20_000);
    expect(useGameStore.getState().game).toMatchObject({ inventory: { milk: 0, butter: 3 } });
  });
});
