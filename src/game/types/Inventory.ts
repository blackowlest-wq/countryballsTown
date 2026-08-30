import type { FishType } from "./Fish";
import type {
  FoodProductType,
  LivestockProductType,
  ProcessedProductType,
} from "./Product";

/**
 * Stable semantic ids used by the canonical inventory record.
 * Seeds, mining resources, and the cave bag intentionally remain separate
 * domains; fish caught in the village are regular inventory items here.
 */
export type InventoryItemId =
  | "wheat"
  | "tomato"
  | "rice"
  | LivestockProductType
  | ProcessedProductType
  | FoodProductType
  | FishType;

export type ProductInventoryKey = Exclude<
  InventoryItemId,
  "wheat" | "tomato" | "rice" | FishType
>;

export type InventoryState = Record<InventoryItemId, number>;

export const INVENTORY_ITEM_IDS: readonly InventoryItemId[] = [
  "wheat",
  "tomato",
  "rice",
  "milk",
  "pork",
  "eggs",
  "wheat-flour",
  "butter",
  "cheese",
  "ham",
  "sausage",
  "bacon",
  "pizza",
  "bread",
  "hot-dog",
  "croissant",
  "ham-sandwich",
  "onigiri",
  "omurice",
  "grilled-fish",
  "seafood-bowl",
  "cheese-bread",
  "bacon-egg",
  "sushi",
  "mixed-pizza",
  "butter-rice",
  "fish-sandwich",
  "fried-rice",
  "hamburger",
  "dumplings",
  "pancakes",
  "sardine",
  "mackerel",
  "sea-bream",
  "tuna",
];
