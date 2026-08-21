import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { useGameStore } from "../src/store/gameStore";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    milkFactoryPanelBuildingId: null,
    porkFactoryPanelBuildingId: null,
    pizzaShopPanelBuildingId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    notice: null,
  });
});

describe("map store interaction", () => {
  it("海と川への移動で住民を連れて行き、村へ戻れる", () => {
    const residentIds = useGameStore.getState().game.residents.map((resident) => resident.id);
    useGameStore.setState({
      interactionMode: "farm",
      isBuildMenuOpen: true,
      isResidentPanelOpen: true,
    });

    useGameStore.getState().travelToMap("sea-and-river", 5_000);

    expect(useGameStore.getState()).toMatchObject({
      interactionMode: "inspect",
      isBuildMenuOpen: false,
      isResidentPanelOpen: false,
      game: { currentMap: "sea-and-river" },
      notice: "海と川へ移動しました。",
    });
    expect(useGameStore.getState().game.residents.map((resident) => resident.id))
      .toEqual(residentIds);

    useGameStore.getState().travelToMap("village", 6_000);
    expect(useGameStore.getState().game.currentMap).toBe("village");
    expect(useGameStore.getState().notice).toBe("村へ戻りました。");
  });
});
