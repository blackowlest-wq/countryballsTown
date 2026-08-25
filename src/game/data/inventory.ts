import {
  CRAFTING_PRODUCT_TYPES,
  CRAFTING_RECIPES,
  type CraftingOutputKey,
} from "../types/Crafting";

export type InventoryPresentationCategory = "livestock" | "processed" | "food";

export type InventoryCountKey =
  | "milk"
  | "pork"
  | "eggs"
  | "wheatFlour"
  | "butter"
  | "cheese"
  | "ham"
  | "sausage"
  | "bacon"
  | CraftingOutputKey;

export interface InventoryPresentationDefinition {
  id: string;
  category: InventoryPresentationCategory;
  name: string;
  icon: string;
  description: string;
  countKey: InventoryCountKey;
}

const livestockDefinitions: readonly InventoryPresentationDefinition[] = [
  {
    id: "livestock:milk",
    category: "livestock",
    name: "牛乳",
    icon: "🥛",
    description: "牛から収穫できる素材。",
    countKey: "milk",
  },
  {
    id: "livestock:pork",
    category: "livestock",
    name: "豚肉",
    icon: "🥩",
    description: "豚から収穫できる素材。",
    countKey: "pork",
  },
  {
    id: "livestock:eggs",
    category: "livestock",
    name: "卵",
    icon: "🥚",
    description: "鶏から収穫できる素材。",
    countKey: "eggs",
  },
];

const processedDefinitions: readonly InventoryPresentationDefinition[] = [
  {
    id: "processed:wheat-flour",
    category: "processed",
    name: "小麦粉",
    icon: "🥣",
    description: "小麦工場で小麦から作る加工品。",
    countKey: "wheatFlour",
  },
  {
    id: "processed:butter",
    category: "processed",
    name: "バター",
    icon: "🧈",
    description: "牛乳工場で牛乳から作る加工品。",
    countKey: "butter",
  },
  {
    id: "processed:cheese",
    category: "processed",
    name: "チーズ",
    icon: "🧀",
    description: "牛乳工場で牛乳から作る加工品。",
    countKey: "cheese",
  },
  {
    id: "processed:ham",
    category: "processed",
    name: "ハム",
    icon: "🍖",
    description: "豚肉工場で豚肉から作る加工品。",
    countKey: "ham",
  },
  {
    id: "processed:sausage",
    category: "processed",
    name: "ソーセージ",
    icon: "🌭",
    description: "豚肉工場で豚肉から作る加工品。",
    countKey: "sausage",
  },
  {
    id: "processed:bacon",
    category: "processed",
    name: "ベーコン",
    icon: "🥓",
    description: "豚肉工場で豚肉から作る加工品。",
    countKey: "bacon",
  },
];

const foodDefinitions: readonly InventoryPresentationDefinition[] = CRAFTING_PRODUCT_TYPES.map(
  (productType) => {
    const recipe = CRAFTING_RECIPES[productType];
    return {
      id: `food:${productType}`,
      category: "food",
      name: recipe.name,
      icon: recipe.icon,
      description: "材料を加工して作る食べ物。",
      countKey: recipe.outputKey,
    };
  },
);

export const inventoryPresentationDefinitions: readonly InventoryPresentationDefinition[] = [
  ...livestockDefinitions,
  ...processedDefinitions,
  ...foodDefinitions,
];
