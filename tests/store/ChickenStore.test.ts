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
    notice: null,
  });
});

describe("chicken store interaction", () => {
  it("卵を収穫できる鶏をタップすると卵が2個増える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "chicken",
      8,
      8,
      "chicken-test",
      1_000,
    );
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });
    const readyAt = placed.state.chickenProductions[0].eggReadyAt;

    expect(useGameStore.getState().collectChickenEggs("chicken-test", readyAt)).toBe("collected");
    expect(getInventoryCount(useGameStore.getState().game, "eggs")).toBe(2);
    expect(useGameStore.getState().notice).toBe("卵を2個収穫しました！");
  });
});
