import { afterEach, describe, expect, it } from "vitest";
import {
  CAVE_FUEL_PURCHASE_COST,
  CAVE_MAX_DRILL_LEVEL,
  CAVE_MAX_FUEL_TANK_LEVEL,
  CAVE_MAX_MINING_CAPACITY_LEVEL,
} from "../../src/game/constants/gameConstants";
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

  it("予期せぬ終了後に採掘ゲームを開くと保存済みのバッグを復元する", () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        miningInventory: { ...base.miningInventory, copper: 2 },
        caveMining: {
          ...base.caveMining,
          carriedInventory: { ...base.caveMining.carriedInventory, copper: 1 },
        },
      },
    });

    expect(useGameStore.getState().openCaveMiningGame()).toBe(true);
    expect(useGameStore.getState().game.miningInventory.copper).toBe(2);
    expect(useGameStore.getState().game.caveMining.carriedInventory.copper).toBe(1);
  });

  it("採掘操作のダメージ蓄積と採掘結果を保存し、通知する", () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), currentMap: "cave" },
      isCaveMiningGameOpen: true,
    });

    expect(useGameStore.getState().digCave("left")).toBe("damaged");
    expect(useGameStore.getState().game.miningInventory.copper).toBe(0);
    expect(useGameStore.getState().notice).toContain("地面を削りました");
    expect(useGameStore.getState().digCave("left")).toBe("damaged");
    expect(useGameStore.getState().notice).toContain("ヒビが入りました");
    expect(useGameStore.getState().digCave("left")).toBe("dug");
    expect(useGameStore.getState().game.miningInventory.copper).toBe(1);
    expect(useGameStore.getState().game.caveMining.carriedInventory.copper).toBe(1);
    expect(useGameStore.getState().game.caveMining.fuel).toBe(7);
    expect(useGameStore.getState().notice).toBe("銅を1個見つけました！");
  });

  it("ゲーム終了時に採掘バッグを空にし、採掘材料を蓄積したままにする", () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        miningInventory: { ...base.miningInventory, copper: 1 },
        caveMining: {
          ...base.caveMining,
          carriedInventory: { ...base.caveMining.carriedInventory, copper: 1 },
        },
      },
      isCaveMiningGameOpen: true,
    });

    useGameStore.getState().closeCaveMiningGame();

    expect(useGameStore.getState().isCaveMiningGameOpen).toBe(false);
    expect(useGameStore.getState().game.miningInventory.copper).toBe(1);
    expect(useGameStore.getState().game.caveMining.carriedInventory.copper).toBe(0);
  });

  it("ゲームを開き直しても採掘状態をリセットしない", () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        caveMining: {
          ...base.caveMining,
          position: { x: 2, depth: 0 },
          excavatedCells: ["3:0", "2:0"],
          cellDamage: { "4:0": 4 },
        },
      },
    });

    expect(useGameStore.getState().openCaveMiningGame()).toBe(true);
    expect(useGameStore.getState().game.caveMining.position).toEqual({ x: 2, depth: 0 });
    expect(useGameStore.getState().game.caveMining.cellDamage).toEqual({ "4:0": 4 });
  });

  it("採掘リセットボタンのStore操作で位置・配置・ダメージを初期化する", () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        caveMining: {
          ...base.caveMining,
          layoutSeed: 123,
          position: { x: 2, depth: 0 },
          excavatedCells: ["3:0", "2:0"],
          cellDamage: { "4:0": 4 },
        },
      },
      isCaveMiningGameOpen: true,
    });

    expect(useGameStore.getState().resetCaveMining()).toBe(true);
    expect(useGameStore.getState().game.caveMining.position).toEqual({ x: 3, depth: 0 });
    expect(useGameStore.getState().game.caveMining.excavatedCells).toEqual(["3:0"]);
    expect(useGameStore.getState().game.caveMining.cellDamage).toEqual({});
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
    expect(useGameStore.getState().game.caveMining.fuel).toBe(10);
    expect(useGameStore.getState().upgradeCave("drill")).toBe(true);
    expect(useGameStore.getState().game.caveMining.drillLevel).toBe(1);
  });

  it("ドリル硬度が上限ならStoreから追加強化できない", () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        coins: 999_999,
        caveMining: { ...base.caveMining, drillLevel: CAVE_MAX_DRILL_LEVEL },
      },
      isCaveMiningGameOpen: true,
    });

    expect(useGameStore.getState().upgradeCave("drill")).toBe(false);
    expect(useGameStore.getState().game.caveMining.drillLevel).toBe(CAVE_MAX_DRILL_LEVEL);
    expect(useGameStore.getState().notice).toBe("ドリル硬度は最大レベルです。");
  });

  it("燃料タンクとバッグ容量が上限ならStoreから追加強化できない", () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        coins: 999_999,
        caveMining: {
          ...base.caveMining,
          fuelTankLevel: CAVE_MAX_FUEL_TANK_LEVEL,
          miningCapacityLevel: CAVE_MAX_MINING_CAPACITY_LEVEL,
        },
      },
      isCaveMiningGameOpen: true,
    });

    expect(useGameStore.getState().upgradeCave("fuel-tank")).toBe(false);
    expect(useGameStore.getState().notice).toBe("燃料タンクは最大レベルです。");
    expect(useGameStore.getState().upgradeCave("mining-capacity")).toBe(false);
    expect(useGameStore.getState().notice).toBe("バッグ容量は最大レベルです。");
  });
});
