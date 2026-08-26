import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { FISHING_ROD_COST } from "../../src/game/constants/gameConstants";
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
  it("釣り竿を購入すると桟橋から釣りを始められる", () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), coins: FISHING_ROD_COST },
    });
    useGameStore.getState().openFishingPrompt();

    expect(useGameStore.getState()).toMatchObject({
      isFishingPromptOpen: true,
      isFishingGameOpen: false,
      interactionMode: "inspect",
    });

    expect(useGameStore.getState().startFishingGame()).toBe(false);
    expect(useGameStore.getState().isFishingPromptOpen).toBe(true);
    expect(useGameStore.getState().purchaseFishingRod()).toBe(true);
    expect(useGameStore.getState().game).toMatchObject({
      coins: 0,
      hasFishingRod: true,
    });

    expect(useGameStore.getState().startFishingGame()).toBe(true);
    expect(useGameStore.getState()).toMatchObject({
      isFishingPromptOpen: false,
      isFishingGameOpen: true,
    });
  });

  it("1000コイン未満では釣り竿を購入できない", () => {
    useGameStore.getState().openFishingPrompt();

    expect(useGameStore.getState().purchaseFishingRod()).toBe(false);
    expect(useGameStore.getState().game).toMatchObject({
      coins: 100,
      hasFishingRod: false,
    });
    expect(useGameStore.getState().notice).toBe("コインが足りません。");
  });

  it("釣り成功時に魚を所持品へ追加する", () => {
    useGameStore.getState().recordFishCatch("tuna");
    useGameStore.getState().recordFishCatch("tuna");

    expect(useGameStore.getState().game.inventory).toMatchObject({
      sardine: 0,
      mackerel: 0,
      "sea-bream": 0,
      tuna: 2,
    });
    expect(useGameStore.getState().game.encyclopediaCollectedIds).toContain("fish:tuna");
  });
});
