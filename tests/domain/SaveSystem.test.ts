import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  INITIAL_TOMATO_SEEDS,
  INITIAL_WHEAT_SEEDS,
  INITIAL_RICE_SEEDS,
  MAX_COINS,
  RESIDENT_REQUEST_INITIAL_DELAY_MS,
} from "../../src/game/constants/gameConstants";
import {
  loadGameState,
  prepareGameStateForSave,
  saveGameState,
  type StorageLike,
} from "../../src/game/systems/SaveSystem";
import { getLocalDateKey } from "../../src/utils/date";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function stateWithUnscheduledFactory() {
  const initial = createInitialGameState(0);
  return {
    ...initial,
    buildings: [{ id: "factory-test", buildingId: "milk-factory", gridX: 8, gridY: 8 }],
    milkFactoryProductions: [{
      buildingInstanceId: "factory-test",
      productType: "butter" as const,
      nextProductionAt: Number.NaN,
    }],
  };
}

describe("SaveSystem", () => {
  it("保存用canonical stateを返し、指定時刻をタイマーとlastSavedAtへ反映する", () => {
    const state = stateWithUnscheduledFactory();
    const now = 123_000;

    const prepared = prepareGameStateForSave(state, now);
    const saved = saveGameState(state, memoryStorage(), now);

    expect(prepared).toEqual(saved);
    expect(saved.lastSavedAt).toBe(now);
    expect(saved.milkFactoryProductions).toEqual([{
      buildingInstanceId: "factory-test",
      productType: "butter",
      nextProductionAt: now + 20_000,
    }]);
  });

  it("ストレージがない、または書き込みに失敗してもcanonical stateを返す", () => {
    const state = stateWithUnscheduledFactory();
    const now = 456_000;
    const expected = prepareGameStateForSave(state, now);
    const throwingStorage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };

    expect(saveGameState(state, undefined, now)).toEqual(expected);
    expect(saveGameState(state, throwingStorage, now)).toEqual(expected);
  });

  it("ゲーム状態を保存して復元できる", () => {
    const storage = memoryStorage();
    const original = {
      ...createInitialGameState(0),
      coins: 321.4,
      villageLevel: 2,
      hasFishingRod: true,
      wheatSeeds: 4,
      wheat: 4,
      tomatoSeeds: 3,
      tomatoes: 2,
      eggs: 7,
      milk: 6,
      pork: 5,
      butter: 4,
      cheese: 3,
      ham: 2,
      sausage: 4,
      bacon: 1,
      pizzas: 2,
      fishInventory: {
        sardine: 3,
        mackerel: 2,
        "sea-bream": 1,
        tuna: 4,
      },
      crops: [
        { type: "wheat" as const, gridX: 8, gridY: 8, plantedAt: 50 },
        { type: "tomato" as const, gridX: 10, gridY: 10, plantedAt: 60 },
      ],
      buildings: [
        ...createInitialGameState(0).buildings,
        { id: "field-test", buildingId: "field", gridX: 8, gridY: 8 },
        { id: "field-tomato", buildingId: "field", gridX: 10, gridY: 10 },
        { id: "cow-test", buildingId: "cow", gridX: 12, gridY: 12 },
        { id: "factory-test", buildingId: "milk-factory", gridX: 14, gridY: 12 },
        { id: "pig-test", buildingId: "pig", gridX: 16, gridY: 12 },
        { id: "chicken-test", buildingId: "chicken", gridX: 17, gridY: 12 },
        { id: "pork-factory-test", buildingId: "pork-factory", gridX: 18, gridY: 12 },
      ],
      cowProductions: [{ buildingInstanceId: "cow-test", milkReadyAt: 75 }],
      milkFactoryProductions: [{
        buildingInstanceId: "factory-test",
        productType: "cheese" as const,
        nextProductionAt: 20_000,
      }],
      pigProductions: [{ buildingInstanceId: "pig-test", porkReadyAt: 80 }],
      chickenProductions: [{ buildingInstanceId: "chicken-test", eggReadyAt: 85 }],
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-test",
        productType: "bacon" as const,
        nextProductionAt: 30_000,
      }],
      residentRequestsStartedToday: 2,
    };
    saveGameState(original, storage);
    expect(loadGameState(storage, 100)).toMatchObject({
      coins: 321.4,
      villageLevel: 2,
      hasFishingRod: true,
      wheatSeeds: 4,
      wheat: 4,
      tomatoSeeds: 3,
      tomatoes: 2,
      eggs: 7,
      milk: 6,
      pork: 5,
      butter: 4,
      cheese: 3,
      ham: 2,
      sausage: 4,
      bacon: 1,
      pizzas: 2,
      fishInventory: {
        sardine: 3,
        mackerel: 2,
        "sea-bream": 1,
        tuna: 4,
      },
      crops: [
        { type: "wheat", gridX: 8, gridY: 8, plantedAt: 50 },
        { type: "tomato", gridX: 10, gridY: 10, plantedAt: 60 },
      ],
      cowProductions: [{ buildingInstanceId: "cow-test", milkReadyAt: 75 }],
      milkFactoryProductions: [{
        buildingInstanceId: "factory-test",
        productType: "cheese",
        nextProductionAt: 20_000,
      }],
      pigProductions: [{ buildingInstanceId: "pig-test", porkReadyAt: 80 }],
      chickenProductions: [{ buildingInstanceId: "chicken-test", eggReadyAt: 85 }],
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-test",
        productType: "bacon",
        nextProductionAt: 30_000,
      }],
      residentRequestsStartedToday: 2,
    });
  });

  it("保存境界で所持コインを上限へ正規化する", () => {
    const storage = memoryStorage();
    const state = { ...createInitialGameState(0), coins: MAX_COINS + 500 };

    const saved = saveGameState(state, storage, 1_000);
    const loaded = loadGameState(storage, 2_000);

    expect(saved.coins).toBe(MAX_COINS);
    expect(loaded.coins).toBe(MAX_COINS);
    expect(JSON.parse(storage.getItem("world-small-village:save:v1") ?? "{}").coins)
      .toBe(MAX_COINS);
  });

  it("採掘物と地面採掘ゲームの進行状態を保存して復元する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    const original = {
      ...state,
      miningInventory: { ...state.miningInventory, copper: 2, fossil: 1 },
      caveMining: {
        ...state.caveMining,
        fuel: 3,
        fuelTankLevel: 1,
        drillLevel: 2,
        miningCapacityLevel: 1,
        carriedInventory: { ...state.caveMining.carriedInventory, copper: 1 },
        layoutSeed: 123,
        position: { x: 2, depth: 1 },
        excavatedCells: ["3:0", "2:0", "2:1"],
        cellDamage: { "4:0": 4 },
      },
    };

    saveGameState(original, storage, 1_000);

    expect(loadGameState(storage, 2_000)).toMatchObject({
      miningInventory: { copper: 2, fossil: 1 },
      caveMining: {
        fuel: 3,
        fuelTankLevel: 1,
        drillLevel: 2,
        miningCapacityLevel: 1,
        carriedInventory: { copper: 1 },
        layoutSeed: 123,
        position: { x: 2, depth: 1 },
        excavatedCells: ["3:0", "2:0", "2:1"],
        cellDamage: { "4:0": 4 },
      },
    });
  });

  it("採掘情報がない旧セーブデータを初期状態へ移行する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    const { miningInventory: _miningInventory, caveMining: _caveMining, ...legacyState } = state;
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      miningInventory: state.miningInventory,
      caveMining: state.caveMining,
    });
  });

  it("作物情報がない旧セーブデータを移行する", () => {
    const storage = memoryStorage();
    const {
      wheatSeeds: _wheatSeeds,
      wheat: _wheat,
      tomatoSeeds: _tomatoSeeds,
      tomatoes: _tomatoes,
      crops: _crops,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheatSeeds: INITIAL_WHEAT_SEEDS,
      wheat: 0,
      tomatoSeeds: INITIAL_TOMATO_SEEDS,
      tomatoes: 0,
      crops: [],
    });
  });

  it("小麦専用の旧セーブを共通作物へ移行し、トマトの種を5個追加する", () => {
    const storage = memoryStorage();
    const {
      tomatoSeeds: _tomatoSeeds,
      tomatoes: _tomatoes,
      crops: _crops,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...legacyState,
      wheatSeeds: 4,
      wheat: 3,
      wheatCrops: [{ gridX: 8, gridY: 8, plantedAt: 50 }],
      buildings: [
        ...legacyState.buildings,
        { id: "field-test", buildingId: "field", gridX: 8, gridY: 8 },
      ],
    }));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheatSeeds: 4,
      wheat: 3,
      tomatoSeeds: INITIAL_TOMATO_SEEDS,
      tomatoes: 0,
      crops: [{ type: "wheat", gridX: 8, gridY: 8, plantedAt: 50 }],
    });
  });

  it("旧仕様の畑外作物を除き、失わないよう種として返す", () => {
    const storage = memoryStorage();
    const {
      wheatSeeds: _wheatSeeds,
      tomatoSeeds: _tomatoSeeds,
      tomatoes: _tomatoes,
      crops: _crops,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...legacyState,
      wheatCrops: [
        { gridX: 8, gridY: 8, plantedAt: 50 },
        { gridX: 12, gridY: 12, plantedAt: 60 },
      ],
    }));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheatSeeds: INITIAL_WHEAT_SEEDS + 2,
      tomatoSeeds: INITIAL_TOMATO_SEEDS,
      crops: [],
    });
  });

  it("畑外のトマトを除き、トマトの種として返す", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      crops: [{ type: "tomato", gridX: 8, gridY: 8, plantedAt: 50 }],
    }));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      tomatoSeeds: INITIAL_TOMATO_SEEDS + 1,
      crops: [],
    });
  });

  it("牛乳情報がない旧セーブデータを移行する", () => {
    const storage = memoryStorage();
    const {
      milk: _milk,
      cowProductions: _cowProductions,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      milk: 0,
      cowProductions: [],
    });
  });

  it("卵情報がない旧セーブデータを移行する", () => {
    const storage = memoryStorage();
    const {
      eggs: _eggs,
      chickenProductions: _chickenProductions,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      eggs: 0,
      chickenProductions: [],
    });
  });

  it("米情報がない旧セーブデータを移行する", () => {
    const storage = memoryStorage();
    const {
      riceSeeds: _riceSeeds,
      rice: _rice,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      riceSeeds: INITIAL_RICE_SEEDS,
      rice: 0,
    });
  });

  it("マップ情報がない旧セーブデータは村から再開する", () => {
    const storage = memoryStorage();
    const { currentMap: _currentMap, ...legacyState } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000).currentMap).toBe("village");
  });

  it("削除された街マップを持つ旧セーブは村から再開する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({ ...state, currentMap: "city" }));

    expect(loadGameState(storage, 1_000).currentMap).toBe("village");
  });

  it("釣り竿情報がない旧セーブデータは未所持へ移行する", () => {
    const storage = memoryStorage();
    const { hasFishingRod: _hasFishingRod, ...legacyState } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000).hasFishingRod).toBe(false);
  });

  it("加工物情報がない旧セーブデータを0個へ移行する", () => {
    const storage = memoryStorage();
    const {
      milk: _milk,
      pork: _pork,
      butter: _butter,
      cheese: _cheese,
      ham: _ham,
      sausage: _sausage,
      bacon: _bacon,
      pizzas: _pizzas,
      milkFactoryProductions: _milkFactoryProductions,
      pigProductions: _pigProductions,
      porkFactoryProductions: _porkFactoryProductions,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      milk: 0,
      pork: 0,
      butter: 0,
      cheese: 0,
      ham: 0,
      sausage: 0,
      bacon: 0,
      pizzas: 0,
      milkFactoryProductions: [],
      pigProductions: [],
      porkFactoryProductions: [],
    });
  });

  it("魚料理情報がない旧セーブデータを0個へ移行する", () => {
    const storage = memoryStorage();
    const {
      grilledFish: _grilledFish,
      seafoodBowls: _seafoodBowls,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      grilledFish: 0,
      seafoodBowls: 0,
    });
  });

  it("壊れたセーブデータは新規状態へ戻す", () => {
    const storage = memoryStorage();
    storage.setItem("world-small-village:save:v1", "not json");
    expect(loadGameState(storage, 100).coins).toBe(100);
  });

  it("お願い情報がない旧セーブデータを移行する", () => {
    const storage = memoryStorage();
    const {
      activeResidentRequest: _activeResidentRequest,
      nextResidentRequestAt: _nextResidentRequestAt,
      lastResidentRequestDefinitionId: _lastResidentRequestDefinitionId,
      residentRequestDayKey: _residentRequestDayKey,
      residentRequestsStartedToday: _residentRequestsStartedToday,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    const loaded = loadGameState(storage, 1_000);
    expect(loaded.activeResidentRequest).toBeNull();
    expect(loaded.nextResidentRequestAt).toBe(1_000 + RESIDENT_REQUEST_INITIAL_DELAY_MS);
    expect(loaded.residentRequestDayKey).toBe(getLocalDateKey(1_000));
    expect(loaded.residentRequestsStartedToday).toBe(0);
  });

  it("重複した建物IDを持つセーブデータを一意なIDへ修復する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      buildings: [
        ...state.buildings,
        { id: "building-5", buildingId: "onsen", gridX: 12, gridY: 12 },
        { id: "building-5", buildingId: "flower", gridX: 2, gridY: 10 },
      ],
    }));

    const loaded = loadGameState(storage, 1_000);
    expect(new Set(loaded.buildings.map((building) => building.id)).size)
      .toBe(loaded.buildings.length);
    expect(loaded.buildings.filter((building) => building.id === "building-5"))
      .toHaveLength(1);
  });

  it("重複した建物IDを保存データへ書き出さない", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    saveGameState({
      ...state,
      buildings: [
        ...state.buildings,
        { id: "legacy-duplicate", buildingId: "tree", gridX: 2, gridY: 10 },
        { id: "legacy-duplicate", buildingId: "flower", gridX: 2, gridY: 12 },
      ],
    }, storage);

    const stored = JSON.parse(storage.getItem("world-small-village:save:v1") ?? "{}") as {
      buildings: Array<{ id: string }>;
    };
    expect(new Set(stored.buildings.map((building) => building.id)).size)
      .toBe(stored.buildings.length);
  });

  it("既存のレベル2以上のセーブへ桜の木を解放する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      villageLevel: 2,
      unlockedBuildings: ["tree", "flower", "onsen", "torii"],
    }));

    const loaded = loadGameState(storage, 1_000);
    expect(loaded.unlockedBuildings).toContain("cherry-tree");
  });

  it("既存のセーブへ畑を解放する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      unlockedBuildings: ["tree", "flower"],
    }));

    expect(loadGameState(storage, 1_000).unlockedBuildings).toContain("field");
  });

  it("既存のセーブへ牛を解放する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      unlockedBuildings: ["field", "tree", "flower"],
    }));

    expect(loadGameState(storage, 1_000).unlockedBuildings).toContain("cow");
  });
});
