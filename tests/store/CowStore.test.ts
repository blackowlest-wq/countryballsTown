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

describe("cow store interaction", () => {
  it("採乳可能な牛をタップすると牛乳が2個増える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "cow",
      8,
      8,
      "cow-test",
      1_000,
    );
    useGameStore.setState({ game: placed.state, interactionMode: "inspect" });
    const readyAt = placed.state.cowProductions[0].milkReadyAt;

    expect(useGameStore.getState().collectCowMilk("cow-test", readyAt)).toBe("collected");
    expect(getInventoryCount(useGameStore.getState().game, "milk")).toBe(2);
    expect(useGameStore.getState().notice).toBe("牛乳を2個しぼりました！");
  });
});
