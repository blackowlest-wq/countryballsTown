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

  it("ピザ屋と中華食堂を節目に中国・アメリカの住民を順番に迎える", () => {
    let state: GameState = {
      ...createInitialGameState(0),
      coins: 1_000,
      unlockedBuildings: [...createInitialGameState(0).unlockedBuildings, "cherry-tree"],
    };
    state = place(state, "cherry-tree", 8, 2, "cherry-tree-1");
    state = place(state, "flower", 8, 4, "flower-1");
    state = place(state, "flower", 9, 4, "flower-2");
    state = place(state, "flower", 10, 4, "flower-3");
    state = evaluateVillageProgress(state).state;
    state = place(state, "onsen", 12, 7, "onsen-1");
    state = evaluateVillageProgress(state).state;
    expect(state.villageLevel).toBe(3);
    expect(state.unlockedCountries).toContain("italy");

    state = place(state, "pizza-shop", 12, 10, "pizza-shop-1");
    const china = evaluateVillageProgress(state);
    expect(china.state.villageLevel).toBe(4);
    expect(china.state.unlockedCountries).toContain("china");
    expect(china.state.residents.map((resident) => resident.countryId))
      .toEqual(["poland", "japan", "italy", "china"]);
    expect(china.state.unlockedBuildings).toContain("chinese-restaurant");

    state = place({ ...china.state, coins: 1_000 }, "chinese-restaurant", 12, 13, "chinese-restaurant-1");
    const usa = evaluateVillageProgress(state);
    expect(usa.state.villageLevel).toBe(5);
    expect(usa.state.unlockedCountries).toContain("usa");
    expect(usa.state.residents.map((resident) => resident.countryId))
      .toEqual(["poland", "japan", "italy", "china", "usa"]);
    expect(usa.state.unlockedBuildings).toContain("burger-shop");
  });
});
