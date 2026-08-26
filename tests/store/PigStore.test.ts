import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { placeBuilding } from "../../src/game/systems/BuildingSystem";
import { useGameStore } from "../../src/store/gameStore";
import { getInventoryCount } from "../../src/game/systems/InventorySystem";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    porkFactoryPanelBuildingId: null,
    notice: null,
  });
});

describe("pig store interaction", () => {
  it("収穫可能な豚をタップすると豚肉が増え、豚は残る", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "pig",
      8,
      8,
      "pig-test",
      1_000,
    );
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });
    const readyAt = placed.state.pigProductions[0].porkReadyAt;

    expect(useGameStore.getState().collectPigPork("pig-test", readyAt)).toBe("collected");
    expect(getInventoryCount(useGameStore.getState().game, "pork")).toBe(2);
    expect(useGameStore.getState().game.buildings).toContainEqual({
      id: "pig-test",
      buildingId: "pig",
      gridX: 8,
      gridY: 8,
    });
    expect(useGameStore.getState().notice).toBe("豚肉を2個収穫しました！");
  });
});
