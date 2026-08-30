import { describe, expect, it } from "vitest";
import {
  buildingCategoryDefinitions,
  getBuildingDefinition,
  playerBuildingIds,
} from "../../src/game/data/buildings";

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
        products: ["pizza", "mixed-pizza"],
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

  it("柵と道路を1マスの建物として定義する", () => {
    expect(playerBuildingIds).toEqual(expect.arrayContaining(["fence", "road"]));
    expect(getBuildingDefinition("fence")).toMatchObject({
      name: "柵",
      width: 1,
      height: 1,
      cost: 10,
      category: "building",
      residentCollision: "blocking",
    });
    expect(getBuildingDefinition("road")).toMatchObject({
      name: "道路",
      width: 1,
      height: 1,
      cost: 5,
      category: "building",
      residentCollision: "passable",
    });
  });

  it("鉱石工房を採掘素材だけで建てる2x2建物として定義する", () => {
    expect(playerBuildingIds).toContain("ore-workshop");
    expect(getBuildingDefinition("ore-workshop")).toMatchObject({
      name: "鉱石工房",
      width: 2,
      height: 2,
      cost: 0,
      miningCost: { copper: 8, iron: 5, crystal: 3 },
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

  it("ごはん屋を日本の複数商品店舗として定義する", () => {
    expect(playerBuildingIds).toContain("rice-shop");
    expect(getBuildingDefinition("rice-shop")).toMatchObject({
      name: "ごはん屋",
      width: 3,
      height: 2,
      category: "building",
      countryId: "japan",
      visitorService: {
        queueCapacity: 3,
        saleCoins: 3,
        products: ["onigiri", "omurice", "butter-rice"],
      },
    });
  });

  it("魚屋を日本の魚料理店舗として定義する", () => {
    expect(playerBuildingIds).toContain("fish-shop");
    expect(getBuildingDefinition("fish-shop")).toMatchObject({
      name: "魚屋",
      width: 3,
      height: 2,
      category: "building",
      countryId: "japan",
      visitorService: {
        queueCapacity: 3,
        saleCoins: 3,
        products: ["grilled-fish", "seafood-bowl", "sushi", "fish-sandwich"],
      },
    });
  });

  it("中華食堂とハンバーガーショップを国別の店舗として定義する", () => {
    expect(playerBuildingIds).toEqual(expect.arrayContaining([
      "chinese-restaurant",
      "burger-shop",
    ]));
    expect(getBuildingDefinition("chinese-restaurant")).toMatchObject({
      name: "中華食堂",
      width: 3,
      height: 2,
      category: "building",
      countryId: "china",
      visitorService: {
        products: ["fried-rice"],
      },
    });
    expect(getBuildingDefinition("burger-shop")).toMatchObject({
      name: "ハンバーガーショップ",
      width: 3,
      height: 2,
      category: "building",
      countryId: "usa",
      visitorService: {
        products: ["hamburger"],
      },
    });
  });
});
