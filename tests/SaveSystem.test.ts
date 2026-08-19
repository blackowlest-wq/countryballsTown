import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { RESIDENT_REQUEST_INITIAL_DELAY_MS } from "../src/game/constants/gameConstants";
import { loadGameState, saveGameState, type StorageLike } from "../src/game/systems/SaveSystem";

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
    const original = { ...createInitialGameState(0), coins: 321, villageLevel: 2 };
    saveGameState(original, storage);
    expect(loadGameState(storage, 100)).toMatchObject({ coins: 321, villageLevel: 2 });
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
      ...legacyState
    } = createInitialGameState(0);
    storage.setItem("world-small-village:save:v1", JSON.stringify(legacyState));

    const loaded = loadGameState(storage, 1_000);
    expect(loaded.activeResidentRequest).toBeNull();
    expect(loaded.nextResidentRequestAt).toBe(1_000 + RESIDENT_REQUEST_INITIAL_DELAY_MS);
  });
});
