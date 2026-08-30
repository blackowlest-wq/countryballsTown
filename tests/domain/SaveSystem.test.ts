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
import { withInventory } from "../inventoryFixture";

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
    const original = withInventory({
      ...createInitialGameState(0),
      coins: 321.4,
      villageLevel: 2,
      hasFishingRod: true,
      wheatSeeds: 4,
      tomatoSeeds: 3,
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
    }, {
      wheat: 4,
      tomato: 2,
      eggs: 7,
      milk: 6,
      pork: 5,
      butter: 4,
      cheese: 3,
      ham: 2,
      sausage: 4,
      bacon: 1,
      pizza: 2,
      sardine: 3,
      mackerel: 2,
      "sea-bream": 1,
      tuna: 4,
    });
    saveGameState(original, storage);
    expect(loadGameState(storage, 100)).toMatchObject({
      coins: 321.4,
      villageLevel: 2,
      hasFishingRod: true,
      wheatSeeds: 4,
      tomatoSeeds: 3,
      inventory: {
        wheat: 4,
        tomato: 2,
        eggs: 7,
        milk: 6,
        pork: 5,
        butter: 4,
        cheese: 3,
        ham: 2,
        sausage: 4,
        bacon: 1,
        pizza: 2,
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

  it("追加料理の在庫キーがない既存セーブを村の状態を保ったまま補完する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    const legacyInventory = Object.fromEntries(
      Object.entries(state.inventory).filter(([itemId]) => !["dumplings", "pancakes"].includes(itemId)),
    );
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      coins: 432,
      villageLevel: 5,
      unlockedBuildings: ["chinese-restaurant", "burger-shop"],
      inventory: legacyInventory,
    }));

    const loaded = loadGameState(storage, 1_000);
    expect(loaded.coins).toBe(432);
    expect(loaded.inventory).toMatchObject({
      dumplings: 0,
      pancakes: 0,
    });
    expect(loaded.unlockedBuildings).toEqual(expect.arrayContaining([
      "great-wall",
      "statue-of-liberty",
    ]));
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

  it("作物情報がないcanonicalセーブデータは空の作物として読み込む", () => {
    const storage = memoryStorage();
    const {
      crops: _crops,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheatSeeds: INITIAL_WHEAT_SEEDS,
      tomatoSeeds: INITIAL_TOMATO_SEEDS,
      inventory: { wheat: 0, tomato: 0 },
      crops: [],
    });
  });

  it("canonical作物を保存して小麦の在庫と一緒に復元する", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      wheatSeeds: 4,
      inventory: { ...state.inventory, wheat: 3 },
      crops: [{ type: "wheat", gridX: 8, gridY: 8, plantedAt: 50 }],
      buildings: [
        ...state.buildings,
        { id: "field-test", buildingId: "field", gridX: 8, gridY: 8 },
      ],
    }));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheatSeeds: 4,
      tomatoSeeds: INITIAL_TOMATO_SEEDS,
      inventory: { wheat: 3, tomato: 0 },
      crops: [{ type: "wheat", gridX: 8, gridY: 8, plantedAt: 50 }],
    });
  });

  it("畑外作物だけを除き、失わないよう種として返す", () => {
    const storage = memoryStorage();
    const state = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify({
      ...state,
      crops: [
        { type: "wheat", gridX: 8, gridY: 8, plantedAt: 50 },
        { type: "wheat", gridX: 12, gridY: 12, plantedAt: 60 },
      ],
      buildings: [
        ...state.buildings,
        { id: "field-test", buildingId: "field", gridX: 8, gridY: 8 },
      ],
    }));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheatSeeds: INITIAL_WHEAT_SEEDS + 1,
      tomatoSeeds: INITIAL_TOMATO_SEEDS,
      crops: [{ type: "wheat", gridX: 8, gridY: 8, plantedAt: 50 }],
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

  it("inventoryがない旧セーブデータは牛乳を含む初期在庫へ戻す", () => {
    const storage = memoryStorage();
    const {
      inventory: _inventory,
      cowProductions: _cowProductions,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      inventory: { milk: 0 },
      cowProductions: [],
    });
  });

  it("inventoryがない旧セーブデータは卵を含む初期在庫へ戻す", () => {
    const storage = memoryStorage();
    const {
      inventory: _inventory,
      chickenProductions: _chickenProductions,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      inventory: { eggs: 0 },
      chickenProductions: [],
    });
  });

  it("inventoryがない旧セーブデータは米を含む初期在庫へ戻す", () => {
    const storage = memoryStorage();
    const {
      riceSeeds: _riceSeeds,
      inventory: _inventory,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      riceSeeds: INITIAL_RICE_SEEDS,
      inventory: { rice: 0 },
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

  it("inventoryがない旧セーブデータは加工物を含む初期在庫へ戻す", () => {
    const storage = memoryStorage();
    const {
      inventory: _inventory,
      milkFactoryProductions: _milkFactoryProductions,
      pigProductions: _pigProductions,
      porkFactoryProductions: _porkFactoryProductions,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      inventory: {
        milk: 0,
        pork: 0,
        butter: 0,
        cheese: 0,
        ham: 0,
        sausage: 0,
        bacon: 0,
        pizza: 0,
      },
      milkFactoryProductions: [],
      pigProductions: [],
      porkFactoryProductions: [],
    });
  });

  it("inventoryがない旧セーブデータは魚料理を含む初期在庫へ戻す", () => {
    const storage = memoryStorage();
    const {
      inventory: _inventory,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      inventory: { "grilled-fish": 0, "seafood-bowl": 0 },
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
