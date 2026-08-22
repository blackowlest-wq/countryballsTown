export type CraftingProductType =
  | "pizza"
  | "bread"
  | "hot-dog"
  | "croissant"
  | "ham-sandwich";

export type CraftingIngredientKey =
  | "bacon"
  | "cheese"
  | "tomatoes"
  | "wheat"
  | "sausage"
  | "butter"
  | "eggs"
  | "ham";

export type CraftingOutputKey =
  | "pizzas"
  | "bread"
  | "hotDogs"
  | "croissants"
  | "hamSandwiches";

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
};

export type CraftingProductSales = Partial<Record<CraftingProductType, number>>;
