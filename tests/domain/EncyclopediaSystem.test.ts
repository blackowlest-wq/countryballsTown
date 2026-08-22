import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  encyclopediaCategories,
  encyclopediaEntries,
} from "../../src/game/data/encyclopedia";
import { syncEncyclopediaCollection } from "../../src/game/systems/EncyclopediaSystem";
import { loadGameState, saveGameState, type StorageLike } from "../../src/game/systems/SaveSystem";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("encyclopedia system", () => {
  it("lists buildings, resources, processing products, and food", () => {
    expect(encyclopediaCategories.map((category) => category.name)).toEqual([
      "建物",
      "自然",
      "作物",
      "畜産物",
      "加工品",
      "食べ物",
    ]);
    expect(encyclopediaEntries).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "building:house", name: "家", category: "building" }),
      expect.objectContaining({ id: "crop:rice", name: "米", category: "crop" }),
      expect.objectContaining({ id: "processed:wheat-flour", name: "小麦粉", category: "processed" }),
      expect.objectContaining({ id: "food:omurice", name: "オムライス", category: "food" }),
    ]));
  });

  it("keeps a collected star after the item is consumed or removed", () => {
    const initial = createInitialGameState(0);
    const collected = syncEncyclopediaCollection({
      ...initial,
      wheat: 1,
      butter: 1,
      pizzas: 1,
    });

    expect(collected.encyclopediaCollectedIds).toEqual(expect.arrayContaining([
      "building:house",
      "crop:wheat",
      "processed:butter",
      "food:pizza",
    ]));

    const afterConsumption = syncEncyclopediaCollection({
      ...collected,
      buildings: collected.buildings.filter((building) => building.buildingId !== "house"),
      wheat: 0,
      butter: 0,
      pizzas: 0,
    });
    expect(afterConsumption.encyclopediaCollectedIds).toEqual(
      expect.arrayContaining(["building:house", "crop:wheat", "processed:butter", "food:pizza"]),
    );
  });

  it("persists collected stars in the save data", () => {
    const storage = memoryStorage();
    const collected = syncEncyclopediaCollection({
      ...createInitialGameState(0),
      omurice: 1,
    });
    saveGameState({ ...collected, omurice: 0 }, storage);

    expect(loadGameState(storage, 100).encyclopediaCollectedIds)
      .toContain("food:omurice");
  });
});
