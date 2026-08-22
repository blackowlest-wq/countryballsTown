import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { placeBuilding } from "../../src/game/systems/BuildingSystem";
import { evaluateVillageProgress } from "../../src/game/systems/VillageProgressSystem";
import type { GameState } from "../../src/game/types/Village";

function place(state: GameState, buildingId: string, x: number, z: number, id: string): GameState {
  const result = placeBuilding(state, buildingId, x, z, id);
  if (!result.success) throw new Error(`Test placement failed: ${result.reason}`);
  return result.state;
}

describe("VillageProgressSystem", () => {
  it("条件未達ならレベル1のまま", () => {
    const result = evaluateVillageProgress(createInitialGameState(0));
    expect(result.state.villageLevel).toBe(1);
    expect(result.events).toHaveLength(0);
  });

  it("木3本と花3輪で日本とレベル2を一度だけ解放する", () => {
    let state = createInitialGameState(0);
    state = {
      ...state,
      unlockedBuildings: [...state.unlockedBuildings, "cherry-tree"],
    };
    state = place(state, "cherry-tree", 8, 2, "cherry-tree-1");
    state = place(state, "flower", 8, 4, "flower-1");
    state = place(state, "flower", 9, 4, "flower-2");
    state = place(state, "flower", 10, 4, "flower-3");
    const first = evaluateVillageProgress(state);
    const second = evaluateVillageProgress(first.state);
    expect(first.state.villageLevel).toBe(2);
    expect(first.state.unlockedCountries).toContain("japan");
    expect(first.state.unlockedBuildings)
      .toEqual(expect.arrayContaining(["onsen", "torii", "cherry-tree"]));
    expect(first.events.filter((event) => event.type === "country-unlocked")).toHaveLength(1);
    expect(second.events).toHaveLength(0);
  });

  it("温泉を建てるとイタリアを一度だけ解放する", () => {
    let state = createInitialGameState(0);
    state = place(state, "tree", 8, 2, "tree-3");
    state = place(state, "flower", 8, 4, "flower-1");
    state = place(state, "flower", 9, 4, "flower-2");
    state = place(state, "flower", 10, 4, "flower-3");
    state = evaluateVillageProgress(state).state;
    state = place({ ...state, coins: 1_000 }, "onsen", 12, 7, "onsen-1");
    const first = evaluateVillageProgress(state);
    const second = evaluateVillageProgress(first.state);
    expect(first.state.villageLevel).toBe(3);
    expect(first.state.unlockedCountries).toContain("italy");
    expect(first.state.unlockedBuildings).toContain("pizza-shop");
    expect(second.events).toHaveLength(0);
  });
});
