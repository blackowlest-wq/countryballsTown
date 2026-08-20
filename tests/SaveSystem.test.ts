import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  INITIAL_TOMATO_SEEDS,
  INITIAL_WHEAT_SEEDS,
  RESIDENT_REQUEST_INITIAL_DELAY_MS,
} from "../src/game/constants/gameConstants";
import { loadGameState, saveGameState, type StorageLike } from "../src/game/systems/SaveSystem";
import { getLocalDateKey } from "../src/utils/date";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("SaveSystem", () => {
  it("ゲーム状態を保存して復元できる", () => {
    const storage = memoryStorage();
    const original = {
      ...createInitialGameState(0),
      coins: 321,
      villageLevel: 2,
      wheatSeeds: 4,
      wheat: 4,
      tomatoSeeds: 3,
      tomatoes: 2,
      milk: 6,
      pork: 5,
      butter: 4,
      cheese: 3,
      ham: 2,
      sausage: 4,
      bacon: 1,
      pizzas: 2,
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
        { id: "pork-factory-test", buildingId: "pork-factory", gridX: 18, gridY: 12 },
      ],
      cowProductions: [{ buildingInstanceId: "cow-test", milkReadyAt: 75 }],
      milkFactoryProductions: [{
        buildingInstanceId: "factory-test",
        productType: "cheese" as const,
        nextProductionAt: 20_000,
      }],
      pigProductions: [{ buildingInstanceId: "pig-test", porkReadyAt: 80 }],
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-test",
        productType: "bacon" as const,
        nextProductionAt: 30_000,
      }],
      residentRequestsStartedToday: 2,
    };
    saveGameState(original, storage);
    expect(loadGameState(storage, 100)).toMatchObject({
      coins: 321,
      villageLevel: 2,
      wheatSeeds: 4,
      wheat: 4,
      tomatoSeeds: 3,
      tomatoes: 2,
      milk: 6,
      pork: 5,
      butter: 4,
      cheese: 3,
      ham: 2,
      sausage: 4,
      bacon: 1,
      pizzas: 2,
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
      porkFactoryProductions: [{
        buildingInstanceId: "pork-factory-test",
        productType: "bacon",
        nextProductionAt: 30_000,
      }],
      residentRequestsStartedToday: 2,
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
