import { describe, expect, it } from "vitest";
import {
  FOOD_PRODUCT_TYPES,
  PRODUCT_CATALOG,
  getFavoriteProductsForCountry,
  getProductsForStore,
} from "../../src/game/data/productCatalog";
import { CRAFTING_RECIPES } from "../../src/game/types/Crafting";

describe("ProductCatalog", () => {
  it("19種類の料理を価格・単位・レシピと一緒に定義する", () => {
    expect(FOOD_PRODUCT_TYPES).toHaveLength(19);
    expect(PRODUCT_CATALOG["pizza"]).toMatchObject({
      unit: "枚",
      basePrice: 8,
      inventoryKey: "pizza",
      stores: ["pizza-shop"],
      favoriteCountries: ["italy"],
    });
    expect(PRODUCT_CATALOG["mixed-pizza"]).toMatchObject({
      name: "ミックスピザ",
      basePrice: 11,
      recipe: {
        outputKey: "mixed-pizza",
        outputAmount: 1,
        ingredients: {
          "wheat-flour": 2,
          cheese: 1,
          bacon: 1,
          sausage: 1,
          tomato: 1,
        },
      },
    });
    expect(PRODUCT_CATALOG["fried-rice"]).toMatchObject({
      name: "チャーハン",
      basePrice: 6,
      stores: ["chinese-restaurant"],
      favoriteCountries: ["china"],
      recipe: { ingredients: { rice: 1, eggs: 1 } },
    });
    expect(PRODUCT_CATALOG["hamburger"]).toMatchObject({
      name: "ハンバーガー",
      basePrice: 7,
      stores: ["burger-shop"],
      favoriteCountries: ["usa"],
      recipe: { ingredients: { "wheat-flour": 1, pork: 1 } },
    });
    expect(PRODUCT_CATALOG["dumplings"]).toMatchObject({
      name: "餃子",
      basePrice: 7,
      stores: ["chinese-restaurant"],
      favoriteCountries: ["china"],
      recipe: { ingredients: { "wheat-flour": 1, pork: 1 } },
    });
    expect(PRODUCT_CATALOG["pancakes"]).toMatchObject({
      name: "パンケーキ",
      basePrice: 8,
      stores: ["burger-shop"],
      favoriteCountries: ["usa"],
      recipe: { ingredients: { "wheat-flour": 1, eggs: 1, butter: 1 } },
    });
  });

  it("店舗の取扱商品と国別好物をCatalogから導出できる", () => {
    expect(getProductsForStore("bakery")).toEqual([
      "bread",
      "hot-dog",
      "croissant",
      "ham-sandwich",
      "cheese-bread",
      "bacon-egg",
    ]);
    expect(getProductsForStore("fish-shop")).toEqual([
      "grilled-fish",
      "seafood-bowl",
      "sushi",
      "fish-sandwich",
    ]);
    expect(getProductsForStore("chinese-restaurant")).toEqual(["fried-rice", "dumplings"]);
    expect(getProductsForStore("burger-shop")).toEqual(["hamburger", "pancakes"]);
    expect(getFavoriteProductsForCountry("poland")).toEqual([
      "bread",
      "hot-dog",
      "ham-sandwich",
      "cheese-bread",
      "bacon-egg",
    ]);
    expect(getFavoriteProductsForCountry("japan")).toEqual([
      "onigiri",
      "omurice",
      "grilled-fish",
      "seafood-bowl",
      "sushi",
      "butter-rice",
      "fish-sandwich",
    ]);
    expect(getFavoriteProductsForCountry("china")).toEqual(["fried-rice", "dumplings"]);
    expect(getFavoriteProductsForCountry("usa")).toEqual(["hamburger", "pancakes"]);
  });

  it("Crafting recipe projection is generated from the Catalog", () => {
    expect(CRAFTING_RECIPES["cheese-bread"]).toMatchObject({
      productType: "cheese-bread",
      outputKey: "cheese-bread",
      outputAmount: 1,
      ingredients: { "wheat-flour": 1, cheese: 1 },
    });
    expect(CRAFTING_RECIPES["sushi"]).toMatchObject({
      outputKey: "sushi",
      ingredients: { rice: 1, tuna: 1 },
    });
  });
});
