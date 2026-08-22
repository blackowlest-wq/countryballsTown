import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    isBuildMenuOpen: false,
    isResidentPanelOpen: false,
    isEncyclopediaOpen: false,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    notice: null,
  });
});

describe("fishing store interaction", () => {
  it("桟橋から確認画面を開いて釣りを始められる", () => {
    useGameStore.getState().openFishingPrompt();

    expect(useGameStore.getState()).toMatchObject({
      isFishingPromptOpen: true,
      isFishingGameOpen: false,
      interactionMode: "inspect",
    });

    useGameStore.getState().startFishingGame();
    expect(useGameStore.getState()).toMatchObject({
      isFishingPromptOpen: false,
      isFishingGameOpen: true,
    });
  });

  it("釣り成功時に魚を所持品へ追加する", () => {
    useGameStore.getState().recordFishCatch("tuna");
    useGameStore.getState().recordFishCatch("tuna");

    expect(useGameStore.getState().game.fishInventory).toEqual({
      sardine: 0,
      mackerel: 0,
      "sea-bream": 0,
      tuna: 2,
    });
  });
});
