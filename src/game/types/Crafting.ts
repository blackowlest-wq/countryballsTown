export type CraftingProductType =
  | "pizza"
  | "bread"
  | "hot-dog"
  | "croissant"
  | "ham-sandwich"
  | "onigiri"
  | "omurice";

export type CraftingIngredientKey =
  | "bacon"
  | "cheese"
  | "tomatoes"
  | "wheat"
  | "sausage"
  | "butter"
  | "eggs"
  | "ham"
  | "rice";

export type CraftingOutputKey =
  | "pizzas"
  | "bread"
  | "hotDogs"
  | "croissants"
  | "hamSandwiches"
  | "onigiri"
  | "omurice";

export interface CraftingRecipe {
  productType: CraftingProductType;
  name: string;
  icon: string;
  outputKey: CraftingOutputKey;
  outputAmount: number;
  ingredients: Partial<Record<CraftingIngredientKey, number>>;
}

export const CRAFTING_PRODUCT_TYPES: readonly CraftingProductType[] = [
  "pizza",
  "bread",
  "hot-dog",
  "croissant",
  "ham-sandwich",
  "onigiri",
  "omurice",
];

export const CRAFTING_RECIPES: Record<CraftingProductType, CraftingRecipe> = {
  pizza: {
    productType: "pizza",
    name: "ピザ",
    icon: "🍕",
    outputKey: "pizzas",
    outputAmount: 1,
    ingredients: {
      bacon: 1,
      cheese: 1,
      tomatoes: 1,
      wheat: 2,
    },
  },
  bread: {
    productType: "bread",
    name: "パン",
    icon: "🍞",
    outputKey: "bread",
    outputAmount: 1,
    ingredients: { wheat: 1 },
  },
  "hot-dog": {
    productType: "hot-dog",
    name: "ホットドック",
    icon: "🌭",
    outputKey: "hotDogs",
    outputAmount: 1,
    ingredients: {
      wheat: 1,
      sausage: 1,
    },
  },
  croissant: {
    productType: "croissant",
    name: "クロワッサン",
    icon: "🥐",
    outputKey: "croissants",
    outputAmount: 1,
    ingredients: {
      wheat: 2,
      butter: 1,
    },
  },
  "ham-sandwich": {
    productType: "ham-sandwich",
    name: "ハムサンド",
    icon: "🥪",
    outputKey: "hamSandwiches",
    outputAmount: 1,
    ingredients: {
      wheat: 1,
      eggs: 1,
      ham: 1,
    },
  },
  onigiri: {
    productType: "onigiri",
    name: "おにぎり",
    icon: "🍙",
    outputKey: "onigiri",
    outputAmount: 1,
    ingredients: { rice: 1 },
  },
  omurice: {
    productType: "omurice",
    name: "オムライス",
    icon: "🍳",
    outputKey: "omurice",
    outputAmount: 1,
    ingredients: {
      rice: 2,
      tomatoes: 1,
      eggs: 2,
    },
  },
};

export type CraftingProductSales = Partial<Record<CraftingProductType, number>>;
