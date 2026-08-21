import { describe, expect, it } from "vitest";
import {
  buildingCategoryDefinitions,
  getBuildingDefinition,
  playerBuildingIds,
} from "../src/game/data/buildings";

describe("building definitions", () => {
  it("建築カテゴリを建物・自然に統一し、食べ物タブを持たない", () => {
    expect(buildingCategoryDefinitions.map((category) => category.name))
      .toEqual(["建物", "自然"]);
    expect(buildingCategoryDefinitions.some((category) => category.name === "食べ物"))
      .toBe(false);
    expect(playerBuildingIds.map((id) => getBuildingDefinition(id)?.category))
      .toEqual(expect.arrayContaining(["building", "nature"]));
  });

  it("桜の木を自然、ピザ屋を建物に分類する", () => {
    expect(getBuildingDefinition("cherry-tree")).toMatchObject({
      name: "桜の木",
      category: "nature",
      cost: 30,
    });
    expect(getBuildingDefinition("pizza-shop")).toMatchObject({
      category: "building",
      visitorService: {
        queueCapacity: 3,
        saleCoins: 3,
        product: "pizza",
      },
    });
  });

  it("畑を1マスの初期建築物として定義する", () => {
    expect(playerBuildingIds).toContain("field");
    expect(getBuildingDefinition("field")).toMatchObject({
      name: "畑",
      width: 1,
      height: 1,
      cost: 10,
      category: "building",
    });
  });

  it("牛を1マスの初期建築物として定義する", () => {
    expect(playerBuildingIds).toContain("cow");
    expect(getBuildingDefinition("cow")).toMatchObject({
      name: "牛",
      width: 1,
      height: 1,
      cost: 50,
      category: "nature",
    });
  });

  it("牛乳工場を1マスの建物として定義する", () => {
    expect(playerBuildingIds).toContain("milk-factory");
    expect(getBuildingDefinition("milk-factory")).toMatchObject({
      name: "牛乳工場",
      width: 1,
      height: 1,
      cost: 80,
      category: "building",
    });
  });

  it("豚と豚肉工場を1マスの建築物として定義する", () => {
    expect(playerBuildingIds).toEqual(expect.arrayContaining(["pig", "pork-factory"]));
    expect(getBuildingDefinition("pig")).toMatchObject({
      name: "豚",
      width: 1,
      height: 1,
      cost: 50,
      category: "nature",
    });
    expect(getBuildingDefinition("pork-factory")).toMatchObject({
      name: "豚肉工場",
      width: 1,
      height: 1,
      cost: 80,
      category: "building",
    });
  });

  it("鶏を1マスの自然建築物として定義する", () => {
    expect(playerBuildingIds).toContain("chicken");
    expect(getBuildingDefinition("chicken")).toMatchObject({
      name: "鶏",
      width: 1,
      height: 1,
      cost: 50,
      category: "nature",
    });
  });
});
