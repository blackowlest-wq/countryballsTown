import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { RESIDENT_REQUEST_INITIAL_DELAY_MS } from "../src/game/constants/gameConstants";
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
      wheat: 4,
      wheatCrops: [{ gridX: 8, gridY: 8, plantedAt: 50 }],
      residentRequestsStartedToday: 2,
    };
    saveGameState(original, storage);
    expect(loadGameState(storage, 100)).toMatchObject({
      coins: 321,
      villageLevel: 2,
      wheat: 4,
      wheatCrops: [{ gridX: 8, gridY: 8, plantedAt: 50 }],
      residentRequestsStartedToday: 2,
    });
  });

  it("作物情報がない旧セーブデータを移行する", () => {
    const storage = memoryStorage();
    const {
      wheat: _wheat,
      wheatCrops: _wheatCrops,
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    expect(loadGameState(storage, 1_000)).toMatchObject({
      wheat: 0,
      wheatCrops: [],
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
});
