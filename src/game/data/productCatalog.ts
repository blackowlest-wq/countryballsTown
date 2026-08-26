import type {
  FoodProductType,
  LivestockProductType,
  ProcessedProductType,
  ProductCatalogId,
} from "../types/Product";
import type {
  InventoryItemId,
  ProductInventoryKey,
} from "../types/Inventory";
export type {
  FoodProductType,
  LivestockProductType,
  ProcessedProductType,
  ProductCatalogId,
} from "../types/Product";
export type { ProductInventoryKey } from "../types/Inventory";

export type ProductIngredientKey = Exclude<InventoryItemId, FoodProductType>;

export type ProductStoreId = "pizza-shop" | "bakery" | "rice-shop" | "fish-shop";
export type ProductUnit = "個" | "枚";
export type ProductFavoriteCountryId = "poland" | "japan" | "italy";
export type ProductCategory = "livestock" | "processed" | "food";

export interface ProductRecipe {
  outputKey: FoodProductType;
  outputAmount: number;
  ingredients: Partial<Record<ProductIngredientKey, number>>;
}

export interface ProductCatalogEntry {
  id: ProductCatalogId;
  category: ProductCategory;
  name: string;
  icon: string;
  unit: ProductUnit;
  inventoryKey: ProductInventoryKey;
  description: string;
  /** Only food entries have a recipe. */
  recipe?: ProductRecipe;
  /** Empty for raw livestock and processed materials. */
  stores: readonly ProductStoreId[];
  /** Food sale value before visitor demand modifiers. */
  basePrice?: number;
  favoriteCountries: readonly ProductFavoriteCountryId[];
}

export interface ProductIngredientDefinition {
  name: string;
  icon: string;
}

const food = (
  entry: Omit<ProductCatalogEntry, "category"> & {
    id: FoodProductType;
    recipe: ProductRecipe;
    basePrice: number;
  },
): ProductCatalogEntry => ({ ...entry, category: "food" });

const livestock = (
  entry: Omit<ProductCatalogEntry, "category" | "stores" | "favoriteCountries"> & {
    id: LivestockProductType;
  },
): ProductCatalogEntry => ({
  ...entry,
  category: "livestock",
  stores: [],
  favoriteCountries: [],
});

const processed = (
  entry: Omit<ProductCatalogEntry, "category" | "stores" | "favoriteCountries"> & {
    id: ProcessedProductType;
  },
): ProductCatalogEntry => ({
  ...entry,
  category: "processed",
  stores: [],
  favoriteCountries: [],
});

const productDefinitions: readonly ProductCatalogEntry[] = [
  livestock({
    id: "milk",
    name: "牛乳",
    icon: "🥛",
    unit: "個",
    inventoryKey: "milk",
    description: "牛から収穫できる素材。",
  }),
  livestock({
    id: "pork",
    name: "豚肉",
    icon: "🥩",
    unit: "個",
    inventoryKey: "pork",
    description: "豚から収穫できる素材。",
  }),
  livestock({
    id: "eggs",
    name: "卵",
    icon: "🥚",
    unit: "個",
    inventoryKey: "eggs",
    description: "鶏から収穫できる素材。",
  }),
  processed({
    id: "wheat-flour",
    name: "小麦粉",
    icon: "🥣",
    unit: "個",
    inventoryKey: "wheat-flour",
    description: "小麦工場で小麦から作る加工品。",
  }),
  processed({
    id: "butter",
    name: "バター",
    icon: "🧈",
    unit: "個",
    inventoryKey: "butter",
    description: "牛乳工場で牛乳から作る加工品。",
  }),
  processed({
    id: "cheese",
    name: "チーズ",
    icon: "🧀",
    unit: "個",
    inventoryKey: "cheese",
    description: "牛乳工場で牛乳から作る加工品。",
  }),
  processed({
    id: "ham",
    name: "ハム",
    icon: "🍖",
    unit: "個",
    inventoryKey: "ham",
    description: "豚肉工場で豚肉から作る加工品。",
  }),
  processed({
    id: "sausage",
    name: "ソーセージ",
    icon: "🌭",
    unit: "個",
    inventoryKey: "sausage",
    description: "豚肉工場で豚肉から作る加工品。",
  }),
  processed({
    id: "bacon",
    name: "ベーコン",
    icon: "🥓",
    unit: "個",
    inventoryKey: "bacon",
    description: "豚肉工場で豚肉から作る加工品。",
  }),
  food({
    id: "pizza",
    name: "ピザ",
    icon: "🍕",
    unit: "枚",
    inventoryKey: "pizza",
    description: "小麦粉と具材で作る料理。",
    stores: ["pizza-shop"],
    basePrice: 8,
    favoriteCountries: ["italy"],
    recipe: {
      outputKey: "pizza",
      outputAmount: 1,
      ingredients: { bacon: 1, cheese: 1, tomato: 1, "wheat-flour": 2 },
    },
  }),
  food({
    id: "bread",
    name: "パン",
    icon: "🍞",
    unit: "個",
    inventoryKey: "bread",
    description: "小麦粉から作る基本のパン。",
    stores: ["bakery"],
    basePrice: 3,
    favoriteCountries: ["poland"],
    recipe: { outputKey: "bread", outputAmount: 1, ingredients: { "wheat-flour": 1 } },
  }),
  food({
    id: "hot-dog",
    name: "ホットドッグ",
    icon: "🌭",
    unit: "個",
    inventoryKey: "hot-dog",
    description: "小麦粉とソーセージで作る料理。",
    stores: ["bakery"],
    basePrice: 5,
    favoriteCountries: ["poland"],
    recipe: {
      outputKey: "hot-dog",
      outputAmount: 1,
      ingredients: { "wheat-flour": 1, sausage: 1 },
    },
  }),
  food({
    id: "croissant",
    name: "クロワッサン",
    icon: "🥐",
    unit: "個",
    inventoryKey: "croissant",
    description: "小麦粉とバターで作る料理。",
    stores: ["bakery"],
    basePrice: 6,
    favoriteCountries: ["italy"],
    recipe: {
      outputKey: "croissant",
      outputAmount: 1,
      ingredients: { "wheat-flour": 2, butter: 1 },
    },
  }),
  food({
    id: "ham-sandwich",
    name: "ハムサンド",
    icon: "🥪",
    unit: "個",
    inventoryKey: "ham-sandwich",
    description: "小麦粉、卵、ハムで作る料理。",
    stores: ["bakery"],
    basePrice: 7,
    favoriteCountries: ["poland"],
    recipe: {
      outputKey: "ham-sandwich",
      outputAmount: 1,
      ingredients: { "wheat-flour": 1, eggs: 1, ham: 1 },
    },
  }),
  food({
    id: "onigiri",
    name: "おにぎり",
    icon: "🍙",
    unit: "個",
    inventoryKey: "onigiri",
    description: "米から作る料理。",
    stores: ["rice-shop"],
    basePrice: 3,
    favoriteCountries: ["japan"],
    recipe: { outputKey: "onigiri", outputAmount: 1, ingredients: { rice: 1 } },
  }),
  food({
    id: "omurice",
    name: "オムライス",
    icon: "🍳",
    unit: "個",
    inventoryKey: "omurice",
    description: "米、トマト、卵で作る料理。",
    stores: ["rice-shop"],
    basePrice: 7,
    favoriteCountries: ["japan"],
    recipe: {
      outputKey: "omurice",
      outputAmount: 1,
      ingredients: { rice: 2, tomato: 1, eggs: 2 },
    },
  }),
  food({
    id: "grilled-fish",
    name: "焼き魚",
    icon: "🐟",
    unit: "個",
    inventoryKey: "grilled-fish",
    description: "釣ったイワシを焼いた料理。",
    stores: ["fish-shop"],
    basePrice: 4,
    favoriteCountries: ["japan"],
    recipe: { outputKey: "grilled-fish", outputAmount: 1, ingredients: { sardine: 1 } },
  }),
  food({
    id: "seafood-bowl",
    name: "海鮮丼",
    icon: "🍚",
    unit: "個",
    inventoryKey: "seafood-bowl",
    description: "釣った魚を組み合わせた料理。",
    stores: ["fish-shop"],
    basePrice: 10,
    favoriteCountries: ["japan"],
    recipe: {
      outputKey: "seafood-bowl",
      outputAmount: 1,
      ingredients: { mackerel: 1, "sea-bream": 1, tuna: 1 },
    },
  }),
  food({
    id: "cheese-bread",
    name: "チーズパン",
    icon: "🧀",
    unit: "個",
    inventoryKey: "cheese-bread",
    description: "小麦粉とチーズで作るパン。",
    stores: ["bakery"],
    basePrice: 5,
    favoriteCountries: ["poland"],
    recipe: {
      outputKey: "cheese-bread",
      outputAmount: 1,
      ingredients: { "wheat-flour": 1, cheese: 1 },
    },
  }),
  food({
    id: "bacon-egg",
    name: "ベーコンエッグ",
    icon: "🍳",
    unit: "個",
    inventoryKey: "bacon-egg",
    description: "ベーコンと卵で作る料理。",
    stores: ["bakery"],
    basePrice: 5,
    favoriteCountries: ["poland"],
    recipe: { outputKey: "bacon-egg", outputAmount: 1, ingredients: { bacon: 1, eggs: 1 } },
  }),
  food({
    id: "sushi",
    name: "寿司",
    icon: "🍣",
    unit: "個",
    inventoryKey: "sushi",
    description: "米とマグロで作る料理。",
    stores: ["fish-shop"],
    basePrice: 8,
    favoriteCountries: ["japan"],
    recipe: { outputKey: "sushi", outputAmount: 1, ingredients: { rice: 1, tuna: 1 } },
  }),
  food({
    id: "mixed-pizza",
    name: "ミックスピザ",
    icon: "🍕",
    unit: "枚",
    inventoryKey: "mixed-pizza",
    description: "さまざまな具材をのせたピザ。",
    stores: ["pizza-shop"],
    basePrice: 11,
    favoriteCountries: ["italy"],
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
  }),
  food({
    id: "butter-rice",
    name: "バターライス",
    icon: "🍚",
    unit: "個",
    inventoryKey: "butter-rice",
    description: "米とバターで作る料理。",
    stores: ["rice-shop"],
    basePrice: 5,
    favoriteCountries: ["japan"],
    recipe: { outputKey: "butter-rice", outputAmount: 1, ingredients: { rice: 1, butter: 1 } },
  }),
  food({
    id: "fish-sandwich",
    name: "フィッシュサンド",
    icon: "🥪",
    unit: "個",
    inventoryKey: "fish-sandwich",
    description: "小麦粉とイワシで作る料理。",
    stores: ["fish-shop"],
    basePrice: 6,
    favoriteCountries: ["japan"],
    recipe: {
      outputKey: "fish-sandwich",
      outputAmount: 1,
      ingredients: { "wheat-flour": 1, sardine: 1 },
    },
  }),
];

/** The single source of truth for stocked materials and craftable food. */
export const PRODUCT_CATALOG: Readonly<Record<ProductCatalogId, ProductCatalogEntry>> =
  Object.fromEntries(productDefinitions.map((entry) => [entry.id, entry])) as Record<
    ProductCatalogId,
    ProductCatalogEntry
  >;

export const productCatalogEntries: readonly ProductCatalogEntry[] = productDefinitions;
export const FOOD_PRODUCT_TYPES: readonly FoodProductType[] = productDefinitions
  .filter((entry): entry is ProductCatalogEntry & { id: FoodProductType; recipe: ProductRecipe } =>
    entry.category === "food")
  .map((entry) => entry.id);

const productIngredientDefinitions: Readonly<Record<ProductIngredientKey, ProductIngredientDefinition>> = {
  milk: { name: "牛乳", icon: "🥛" },
  pork: { name: "豚肉", icon: "🥩" },
  bacon: { name: "ベーコン", icon: "🥓" },
  cheese: { name: "チーズ", icon: "🧀" },
  tomato: { name: "トマト", icon: "🍅" },
  wheat: { name: "小麦", icon: "🌾" },
  "wheat-flour": { name: "小麦粉", icon: "🥣" },
  sausage: { name: "ソーセージ", icon: "🌭" },
  butter: { name: "バター", icon: "🧈" },
  eggs: { name: "卵", icon: "🥚" },
  ham: { name: "ハム", icon: "🍖" },
  rice: { name: "米", icon: "🍚" },
  sardine: { name: "イワシ", icon: "🐟" },
  mackerel: { name: "サバ", icon: "🐟" },
  "sea-bream": { name: "タイ", icon: "🐟" },
  tuna: { name: "マグロ", icon: "🐟" },
};

export function getProductDefinition(productId: string): ProductCatalogEntry | undefined {
  return PRODUCT_CATALOG[productId as ProductCatalogId];
}

export function getFoodProductDefinition(productType: FoodProductType): ProductCatalogEntry {
  return PRODUCT_CATALOG[productType];
}

export function getProductsForStore(storeId: ProductStoreId): readonly FoodProductType[] {
  return FOOD_PRODUCT_TYPES.filter((productType) =>
    PRODUCT_CATALOG[productType].stores.includes(storeId),
  );
}

export function getProductSalePrice(productType: FoodProductType): number {
  return PRODUCT_CATALOG[productType].basePrice ?? 0;
}

export function getFavoriteProductsForCountry(
  countryId: ProductFavoriteCountryId,
): readonly FoodProductType[] {
  return FOOD_PRODUCT_TYPES.filter((productType) =>
    PRODUCT_CATALOG[productType].favoriteCountries.includes(countryId),
  );
}

export function getProductIngredientDefinition(
  ingredient: ProductIngredientKey,
): ProductIngredientDefinition {
  return productIngredientDefinitions[ingredient];
}
