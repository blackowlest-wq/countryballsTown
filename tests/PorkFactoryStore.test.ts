import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { placeBuilding } from "../src/game/systems/BuildingSystem";
import { useGameStore } from "../src/store/gameStore";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    porkFactoryPanelBuildingId: null,
    notice: null,
  });
});

describe("pork factory store interaction", () => {
  it("豚肉工場で作るものを選ぶと豚肉1個で加工物を3個生産する", () => {
    const placed = placeBuilding(
      { ...createInitialGameState(0), pork: 1 },
      "pork-factory",
      8,
      8,
      "pork-factory-test",
    );
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });

    useGameStore.getState().openPorkFactoryPanel("pork-factory-test");
    expect(useGameStore.getState().porkFactoryPanelBuildingId).toBe("pork-factory-test");
    expect(useGameStore.getState().configurePorkFactory("pork-factory-test", "sausage", 0))
      .toBe(true);
    expect(useGameStore.getState().porkFactoryPanelBuildingId).toBeNull();
    expect(useGameStore.getState().game.porkFactoryProductions[0]).toMatchObject({
      productType: "sausage",
      nextProductionAt: 20_000,
    });

    useGameStore.getState().tick(0, 20_000);
    expect(useGameStore.getState().game).toMatchObject({ pork: 0, sausage: 3 });
  });
});
