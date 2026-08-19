import { describe, expect, it } from "vitest";
import {
  buildingCategoryDefinitions,
  getBuildingDefinition,
  playerBuildingIds,
} from "../src/game/data/buildings";

describe("building definitions", () => {
  it("建築カテゴリを建物・自然・食べ物に統一する", () => {
    expect(buildingCategoryDefinitions.map((category) => category.name))
      .toEqual(["建物", "自然", "食べ物"]);
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
      },
    });
  });
});
