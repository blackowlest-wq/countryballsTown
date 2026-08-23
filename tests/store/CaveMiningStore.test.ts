import { afterEach, describe, expect, it } from "vitest";
import { CAVE_FUEL_PURCHASE_COST } from "../../src/game/constants/gameConstants";
import { createInitialCaveMiningState } from "../../src/game/systems/CaveMiningSystem";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    isCaveMiningGameOpen: false,
    isMapTravelOpen: false,
    isEncyclopediaOpen: false,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    notice: null,
  });
});

describe("地面採掘ゲームのStore接続", () => {
  it("洞窟からだけ2Dゲームウィンドウを開ける", () => {
    expect(useGameStore.getState().openCaveMiningGame()).toBe(false);
    expect(useGameStore.getState().isCaveMiningGameOpen).toBe(false);

    useGameStore.setState({
      game: { ...createInitialGameState(0), currentMap: "cave" },
    });

    expect(useGameStore.getState().openCaveMiningGame()).toBe(true);
    expect(useGameStore.getState().isCaveMiningGameOpen).toBe(true);
    useGameStore.getState().closeCaveMiningGame();
    expect(useGameStore.getState().isCaveMiningGameOpen).toBe(false);
  });

  it("採掘操作の結果を保存し、通知する", () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), currentMap: "cave" },
      isCaveMiningGameOpen: true,
    });

    expect(useGameStore.getState().digCave("left")).toBe("dug");
    expect(useGameStore.getState().game.miningInventory.copper).toBe(1);
    expect(useGameStore.getState().game.caveMining.fuel).toBe(9);
    expect(useGameStore.getState().notice).toBe("銅を1個見つけました！");
  });

  it("燃料切れ後の購入と強化をStoreから実行できる", () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        currentMap: "cave",
        coins: CAVE_FUEL_PURCHASE_COST + 50,
        caveMining: { ...createInitialCaveMiningState(), fuel: 0 },
      },
      isCaveMiningGameOpen: true,
    });

    expect(useGameStore.getState().purchaseCaveFuel()).toBe(true);
    expect(useGameStore.getState().game.caveMining.fuel).toBe(5);
    expect(useGameStore.getState().upgradeCave("drill")).toBe(true);
    expect(useGameStore.getState().game.caveMining.drillLevel).toBe(1);
  });
});
