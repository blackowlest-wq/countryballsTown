import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { districtDefinitions } from "../../src/game/data/districts";
import {
  getAllDistrictProgress,
  getDistrictProgress,
  isBuildingAllowedInDistrict,
} from "../../src/game/systems/DistrictSystem";

describe("DistrictSystem", () => {
  it("4地区の許可建物と重複目標を定義する", () => {
    expect(districtDefinitions.map((district) => district.name)).toEqual([
      "農業地区",
      "商業地区",
      "自然公園",
      "工業地区",
    ]);

    const agriculture = getDistrictProgress(createInitialGameState(0), "agriculture");
    expect(agriculture.requirements.map(({ requirement }) => [
      requirement.label,
      requirement.target,
      requirement.type,
    ])).toEqual([
      ["畑", 3, "building-count"],
      ["パン屋", 1, "building-count"],
      ["倉庫", 1, "building-count"],
    ]);
    expect(getDistrictProgress(createInitialGameState(0), "nature-park")
      .requirements[0]).toMatchObject({ current: 2, completed: false });
    expect(getDistrictProgress(createInitialGameState(0), "commercial")
      .requirements[0].requirement).toMatchObject({
        type: "distinct-building-count",
        target: 3,
      });
  });

  it("店舗と工場は重複ではなく異なる種類を数える", () => {
    const state = {
      ...createInitialGameState(0),
      buildings: [
        { id: "pizza-1", buildingId: "pizza-shop", gridX: 1, gridY: 1 },
        { id: "pizza-2", buildingId: "pizza-shop", gridX: 4, gridY: 1 },
        { id: "rice-1", buildingId: "rice-shop", gridX: 7, gridY: 1 },
        { id: "milk-1", buildingId: "milk-factory", gridX: 10, gridY: 1 },
        { id: "pork-1", buildingId: "pork-factory", gridX: 12, gridY: 1 },
        { id: "wheat-1", buildingId: "wheat-factory", gridX: 14, gridY: 1 },
      ],
    };

    expect(getDistrictProgress(state, "commercial").requirements[0])
      .toMatchObject({ current: 2, completed: false });
    expect(getDistrictProgress(state, "industrial").requirements[0])
      .toMatchObject({ current: 3, completed: true });
    expect(getAllDistrictProgress(state)).toHaveLength(4);
  });

  it("地区ごとに関連する建物だけを許可する", () => {
    expect(isBuildingAllowedInDistrict("agriculture", "field")).toBe(true);
    expect(isBuildingAllowedInDistrict("agriculture", "warehouse")).toBe(true);
    expect(isBuildingAllowedInDistrict("agriculture", "pizza-shop")).toBe(false);
    expect(isBuildingAllowedInDistrict("commercial", "pizza-shop")).toBe(true);
    expect(isBuildingAllowedInDistrict("commercial", "bakery")).toBe(false);
    expect(isBuildingAllowedInDistrict("nature-park", "onsen")).toBe(true);
    expect(isBuildingAllowedInDistrict("nature-park", "wheat-factory")).toBe(false);
    expect(isBuildingAllowedInDistrict("industrial", "milk-factory")).toBe(true);
    expect(isBuildingAllowedInDistrict("common", "fence")).toBe(true);
  });
});
