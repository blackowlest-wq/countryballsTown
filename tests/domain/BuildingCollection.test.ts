import { describe, expect, it } from "vitest";
import { createBuildingCollection } from "../../src/game/core/BuildingCollection";
import type { BuildingInstance } from "../../src/game/types/Building";

describe("BuildingCollection", () => {
  it("建物の種類に関係なく重複・空IDを一意なIDへ正規化する", () => {
    const buildings: BuildingInstance[] = [
      { id: "legacy-duplicate", buildingId: "tree", gridX: 1, gridY: 1 },
      { id: "legacy-duplicate", buildingId: "flower", gridX: 2, gridY: 2 },
      { id: "legacy-duplicate", buildingId: "onsen", gridX: 3, gridY: 3 },
      { id: "", buildingId: "torii", gridX: 4, gridY: 4 },
      { id: "", buildingId: "pizza-shop", gridX: 5, gridY: 5 },
    ];

    const collection = createBuildingCollection(buildings);
    const ids = collection.buildings.map((building) => building.id);

    expect(new Set(ids).size).toBe(buildings.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(collection.entries.map((entry) => entry.source)).toEqual(buildings);
    expect(collection.entries.map((entry) => entry.building)).toEqual(collection.buildings);
    expect(buildings.map((building) => collection.idFor(building))).toEqual(ids);
    expect(collection.findUnique("legacy-duplicate")).toEqual({ status: "duplicate-id" });
  });

  it("正規化後は配列を作り直さず、各IDから必ず一件だけ取得できる", () => {
    const buildings: BuildingInstance[] = [
      { id: "tree-1", buildingId: "tree", gridX: 1, gridY: 1 },
      { id: "building-3", buildingId: "flower", gridX: 2, gridY: 2 },
    ];

    const collection = createBuildingCollection(buildings);

    expect(collection.buildings).toBe(buildings);
    expect(collection.nextId()).toBe("building-4");
    expect(collection.findUnique("tree-1")).toMatchObject({
      status: "found",
      building: buildings[0],
      index: 0,
    });
    expect(collection.findUnique("missing")).toEqual({ status: "not-found" });
  });
});
