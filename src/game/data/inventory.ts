import {
  productCatalogEntries,
  type ProductCategory,
  type ProductUnit,
} from "./productCatalog";
import type { ProductInventoryKey } from "../types/Inventory";

export type InventoryPresentationCategory = ProductCategory;
export type InventoryCountKey = ProductInventoryKey;

export interface InventoryPresentationDefinition {
  id: string;
  category: InventoryPresentationCategory;
  name: string;
  icon: string;
  description: string;
  countKey: InventoryCountKey;
  unit: ProductUnit;
}

/** The inventory drawer and the encyclopedia share the ProductCatalog view. */
export const inventoryPresentationDefinitions: readonly InventoryPresentationDefinition[] =
  productCatalogEntries.map((product) => ({
    id: `${product.category}:${product.id}`,
    category: product.category,
    name: product.name,
    icon: product.icon,
    description: product.description,
    countKey: product.inventoryKey,
    unit: product.unit,
  }));
