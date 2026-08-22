import { buildingDefinitions } from "./buildings";
import {
  CRAFTING_PRODUCT_TYPES,
  CRAFTING_RECIPES,
  type CraftingProductType,
} from "../types/Crafting";
import { cropDefinitions, type CropType } from "../types/Crop";

export type EncyclopediaCategoryId =
  | "building"
  | "nature"
  | "crop"
  | "livestock"
  | "processed"
  | "food";

export interface EncyclopediaCategory {
  id: EncyclopediaCategoryId;
  name: string;
  icon: string;
}

export interface EncyclopediaEntry {
  id: string;
  category: EncyclopediaCategoryId;
  name: string;
  icon: string;
  description: string;
}

export const encyclopediaCategories: readonly EncyclopediaCategory[] = [
  { id: "building", name: "建物", icon: "🏠" },
  { id: "nature", name: "自然", icon: "🌿" },
  { id: "crop", name: "作物", icon: "🌱" },
  { id: "livestock", name: "畜産物", icon: "🥚" },
  { id: "processed", name: "加工品", icon: "🏭" },
  { id: "food", name: "食べ物", icon: "🍽️" },
];

const livestockEntries: EncyclopediaEntry[] = [
  {
    id: "livestock:milk",
    category: "livestock",
    name: "牛乳",
    icon: "🥛",
    description: "牛から収穫できる素材。",
  },
  {
    id: "livestock:pork",
    category: "livestock",
    name: "豚肉",
    icon: "🥩",
    description: "豚から収穫できる素材。",
  },
  {
    id: "livestock:eggs",
    category: "livestock",
    name: "卵",
    icon: "🥚",
    description: "鶏から収穫できる素材。",
  },
];

const processedEntries: EncyclopediaEntry[] = [
  {
    id: "processed:wheat-flour",
    category: "processed",
    name: "小麦粉",
    icon: "🥣",
    description: "小麦工場で小麦から作る加工品。",
  },
  {
    id: "processed:butter",
    category: "processed",
    name: "バター",
    icon: "🧈",
    description: "牛乳工場で牛乳から作る加工品。",
  },
  {
    id: "processed:cheese",
    category: "processed",
    name: "チーズ",
    icon: "🧀",
    description: "牛乳工場で牛乳から作る加工品。",
  },
  {
    id: "processed:ham",
    category: "processed",
    name: "ハム",
    icon: "🍖",
    description: "豚肉工場で豚肉から作る加工品。",
  },
  {
    id: "processed:sausage",
    category: "processed",
    name: "ソーセージ",
    icon: "🌭",
    description: "豚肉工場で豚肉から作る加工品。",
  },
  {
    id: "processed:bacon",
    category: "processed",
    name: "ベーコン",
    icon: "🥓",
    description: "豚肉工場で豚肉から作る加工品。",
  },
];

function createBuildingEntries(): EncyclopediaEntry[] {
  return buildingDefinitions.map((building) => ({
    id: `building:${building.id}`,
    category: building.category,
    name: building.name,
    icon: building.menuIcon,
    description: building.description,
  }));
}

function createCropEntries(): EncyclopediaEntry[] {
  return (Object.keys(cropDefinitions) as CropType[]).map((cropType) => {
    const crop = cropDefinitions[cropType];
    return {
      id: `crop:${crop.type}`,
      category: "crop",
      name: crop.name,
      icon: crop.icon,
      description: "畑で育てて収穫できる作物。",
    };
  });
}

function createFoodEntries(): EncyclopediaEntry[] {
  return CRAFTING_PRODUCT_TYPES.map((productType: CraftingProductType) => {
    const recipe = CRAFTING_RECIPES[productType];
    return {
      id: `food:${productType}`,
      category: "food",
      name: recipe.name,
      icon: recipe.icon,
      description: "材料を加工して作る食べ物。",
    };
  });
}

export const encyclopediaEntries: readonly EncyclopediaEntry[] = [
  ...createBuildingEntries(),
  ...createCropEntries(),
  ...livestockEntries,
  ...processedEntries,
  ...createFoodEntries(),
];

export function getBuildingEncyclopediaId(buildingId: string): string {
  return `building:${buildingId}`;
}

export function getCropEncyclopediaId(cropType: CropType): string {
  return `crop:${cropType}`;
}

export function getLivestockEncyclopediaId(resource: "milk" | "pork" | "eggs"): string {
  return `livestock:${resource}`;
}

export function getProcessedEncyclopediaId(productType: string): string {
  return `processed:${productType}`;
}

export function getFoodEncyclopediaId(productType: CraftingProductType): string {
  return `food:${productType}`;
}
