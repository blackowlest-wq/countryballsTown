import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  encyclopediaCategories,
  encyclopediaEntries,
} from "../../src/game/data/encyclopedia";
import { inventoryPresentationDefinitions } from "../../src/game/data/inventory";
import { syncEncyclopediaCollection } from "../../src/game/systems/EncyclopediaSystem";
import { loadGameState, saveGameState, type StorageLike } from "../../src/game/systems/SaveSystem";
import { withInventory } from "../inventoryFixture";

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
      "魚",
      "鉱物",
      "化石",
      "遺物",
      "地下生物",
      "作物",
      "畜産物",
      "加工品",
      "食べ物",
    ]);
    expect(encyclopediaEntries).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "building:house", name: "家", category: "building" }),
      expect.objectContaining({ id: "fish:tuna", name: "マグロ", category: "fish" }),
      expect.objectContaining({ id: "mining:diamond", name: "ダイヤモンド", category: "mineral" }),
      expect.objectContaining({ id: "mining:fossil", name: "化石", category: "fossil" }),
      expect.objectContaining({ id: "mining:ancient-relic", name: "古代遺物", category: "artifact" }),
      expect.objectContaining({ id: "crop:rice", name: "米", category: "crop" }),
      expect.objectContaining({ id: "processed:wheat-flour", name: "小麦粉", category: "processed" }),
      expect.objectContaining({ id: "food:omurice", name: "オムライス", category: "food" }),
    ]));
  });

  it("keeps a collected star after the item is consumed or removed", () => {
    const initial = createInitialGameState(0);
    const collected = syncEncyclopediaCollection(withInventory(initial, {
      tuna: 1,
      wheat: 1,
      butter: 1,
      pizza: 1,
    }));

    expect(collected.encyclopediaCollectedIds).toEqual(expect.arrayContaining([
      "building:house",
      "fish:tuna",
      "crop:wheat",
      "processed:butter",
      "food:pizza",
    ]));

    const afterConsumption = syncEncyclopediaCollection(withInventory({
      ...collected,
      buildings: collected.buildings.filter((building) => building.buildingId !== "house"),
    }, {
      tuna: 0,
      wheat: 0,
      butter: 0,
      pizza: 0,
    }));
    expect(afterConsumption.encyclopediaCollectedIds).toEqual(
      expect.arrayContaining(["building:house", "fish:tuna", "crop:wheat", "processed:butter", "food:pizza"]),
    );
  });

  it("shares inventory presentation definitions between the encyclopedia and inventory views", () => {
    expect(inventoryPresentationDefinitions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "livestock:milk",
        name: "牛乳",
        icon: "🥛",
        countKey: "milk",
      }),
      expect.objectContaining({
        id: "processed:butter",
        name: "バター",
        icon: "🧈",
        countKey: "butter",
      }),
      expect.objectContaining({
        id: "food:omurice",
        name: "オムライス",
        icon: "🍳",
        countKey: "omurice",
      }),
    ]));
    expect(encyclopediaEntries).toEqual(expect.arrayContaining(
      inventoryPresentationDefinitions.map(({ id, category, name, icon }) =>
        expect.objectContaining({ id, category, name, icon }),
      ),
    ));
  });

  it("registers every collected mining resource in its cave category", () => {
    const collected = syncEncyclopediaCollection({
      ...createInitialGameState(0),
      miningInventory: {
        ...createInitialGameState(0).miningInventory,
        copper: 1,
        "glowing-mushroom": 1,
      },
    });

    expect(collected.encyclopediaCollectedIds).toEqual(expect.arrayContaining([
      "mining:copper",
      "mining:glowing-mushroom",
    ]));
  });

  it("persists collected stars in the save data", () => {
    const storage = memoryStorage();
    const collected = syncEncyclopediaCollection(withInventory(createInitialGameState(0), {
      tuna: 1,
      omurice: 1,
    }));
    saveGameState(withInventory(collected, { omurice: 0 }), storage);

    expect(loadGameState(storage, 100).encyclopediaCollectedIds)
      .toContain("food:omurice");
    expect(loadGameState(storage, 100).encyclopediaCollectedIds)
      .toContain("fish:tuna");
  });
});
