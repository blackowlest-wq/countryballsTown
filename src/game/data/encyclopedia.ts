import { buildingDefinitions } from "./buildings";
import { fishDefinitions } from "./fish";
import { miningResourceDefinitions } from "./mining";
import {
  inventoryPresentationDefinitions,
  type InventoryPresentationCategory,
} from "./inventory";
import type { CraftingProductType } from "../types/Crafting";
import { cropDefinitions, type CropType } from "../types/Crop";
import type { FishType } from "../types/Fish";

export type EncyclopediaCategoryId =
  | "building"
  | "nature"
  | "fish"
  | "mineral"
  | "fossil"
  | "artifact"
  | "cave-life"
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
  fishType?: FishType;
}

export const encyclopediaCategories: readonly EncyclopediaCategory[] = [
  { id: "building", name: "建物", icon: "🏠" },
  { id: "nature", name: "自然", icon: "🌿" },
  { id: "fish", name: "魚", icon: "🐟" },
  { id: "mineral", name: "鉱物", icon: "💎" },
  { id: "fossil", name: "化石", icon: "🦴" },
  { id: "artifact", name: "遺物", icon: "🏺" },
  { id: "cave-life", name: "地下生物", icon: "🍄" },
  { id: "crop", name: "作物", icon: "🌱" },
  { id: "livestock", name: "畜産物", icon: "🥚" },
  { id: "processed", name: "加工品", icon: "🏭" },
  { id: "food", name: "食べ物", icon: "🍽️" },
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

function createFishEntries(): EncyclopediaEntry[] {
  return fishDefinitions.map((fish) => ({
    id: getFishEncyclopediaId(fish.type),
    category: "fish",
    name: fish.name,
    icon: fish.icon,
    description: fish.description,
    fishType: fish.type,
  }));
}

function createMiningEntries(): EncyclopediaEntry[] {
  return miningResourceDefinitions.map((resource) => ({
    id: `mining:${resource.type}`,
    category: resource.category,
    name: resource.name,
    icon: resource.icon,
    description: resource.description,
  }));
}

function createInventoryEntries(category: InventoryPresentationCategory): EncyclopediaEntry[] {
  return inventoryPresentationDefinitions
    .filter((definition) => definition.category === category)
    .map(({ id, name, icon, description }) => ({
      id,
      category,
      name,
      icon,
      description,
    }));
}

export const encyclopediaEntries: readonly EncyclopediaEntry[] = [
  ...createBuildingEntries(),
  ...createFishEntries(),
  ...createMiningEntries(),
  ...createCropEntries(),
  ...createInventoryEntries("livestock"),
  ...createInventoryEntries("processed"),
  ...createInventoryEntries("food"),
];

export function getBuildingEncyclopediaId(buildingId: string): string {
  return `building:${buildingId}`;
}

export function getCropEncyclopediaId(cropType: CropType): string {
  return `crop:${cropType}`;
}

export function getFishEncyclopediaId(fishType: FishType): string {
  return `fish:${fishType}`;
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
