/** Stable identifiers for food made by a shop. */
export type FoodProductType =
  | "pizza"
  | "bread"
  | "hot-dog"
  | "croissant"
  | "ham-sandwich"
  | "onigiri"
  | "omurice"
  | "grilled-fish"
  | "seafood-bowl"
  | "cheese-bread"
  | "bacon-egg"
  | "sushi"
  | "mixed-pizza"
  | "butter-rice"
  | "fish-sandwich"
  | "fried-rice"
  | "hamburger"
  | "dumplings"
  | "pancakes";

export type LivestockProductType = "milk" | "pork" | "eggs";

export type ProcessedProductType =
  | "wheat-flour"
  | "butter"
  | "cheese"
  | "ham"
  | "sausage"
  | "bacon";

export type ProductCatalogId =
  | FoodProductType
  | LivestockProductType
  | ProcessedProductType;
