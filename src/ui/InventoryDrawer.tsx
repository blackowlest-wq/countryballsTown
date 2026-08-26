import { useState } from "react";
import { cropDefinitions } from "../game/types/Crop";
import { fishDefinitions } from "../game/data/fish";
import { inventoryPresentationDefinitions } from "../game/data/inventory";
import { miningResourceDefinitions } from "../game/data/mining";
import type { GameState } from "../game/types/Village";
import { getInventoryCount } from "../game/systems/InventorySystem";

type InventoryCategoryId = "crops" | "livestock-fish" | "mining" | "processed" | "food";

interface InventoryDrawerProps {
  game: GameState;
  onClose: () => void;
}

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface InventoryCategory {
  id: InventoryCategoryId;
  label: string;
  icon: string;
}

const inventoryCategories: readonly InventoryCategory[] = [
  { id: "crops", label: "作物", icon: "🌱" },
  { id: "livestock-fish", label: "畜産・魚", icon: "🐟" },
  { id: "mining", label: "採掘", icon: "⛏️" },
  { id: "processed", label: "加工品", icon: "🏭" },
  { id: "food", label: "料理", icon: "🍳" },
];

function getInventoryItems(game: GameState, category: InventoryCategoryId): InventoryItem[] {
  switch (category) {
    case "crops":
      return Object.values(cropDefinitions).map((definition) => ({
        id: definition.type,
        name: definition.name,
        icon: definition.icon,
        count: getInventoryCount(game, definition.harvestKey),
      }));
    case "livestock-fish":
      return [
        ...inventoryPresentationDefinitions
          .filter((definition) => definition.category === "livestock")
          .map((definition) => ({
            id: definition.id,
            name: definition.name,
            icon: definition.icon,
          count: getInventoryCount(game, definition.countKey),
          })),
        ...fishDefinitions.map((fish) => ({
          id: `fish-${fish.type}`,
          name: fish.name,
          icon: fish.icon,
          count: getInventoryCount(game, fish.type),
        })),
      ];
    case "mining":
      return miningResourceDefinitions.map((resource) => ({
        id: `mining-${resource.type}`,
        name: resource.name,
        icon: resource.icon,
        count: game.miningInventory[resource.type],
      }));
    case "processed":
      return inventoryPresentationDefinitions
        .filter((definition) => definition.category === "processed")
        .map((definition) => ({
          id: definition.id,
          name: definition.name,
          icon: definition.icon,
          count: getInventoryCount(game, definition.countKey),
        }));
    case "food":
      return inventoryPresentationDefinitions
        .filter((definition) => definition.category === "food")
        .map((definition) => ({
          id: definition.id,
          name: definition.name,
          icon: definition.icon,
          count: getInventoryCount(game, definition.countKey),
        }));
  }
}

function formatCount(count: number): string {
  return count.toLocaleString("ja-JP");
}

export function InventoryDrawer({ game, onClose }: InventoryDrawerProps): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<InventoryCategoryId>("crops");
  const [showAll, setShowAll] = useState(false);
  const items = getInventoryItems(game, activeCategory);
  const visibleItems = showAll ? items : items.filter((item) => item.count > 0);

  return (
    <section
      className="inventory-drawer"
      data-panel="inventory-drawer"
      role="dialog"
      aria-modal="false"
      aria-label="在庫"
    >
      <div className="inventory-drawer-heading">
        <div>
          <strong>在庫</strong>
          <small>{showAll ? "すべての項目" : "所持している項目"}</small>
        </div>
        <button
          className="farm-panel-close"
          type="button"
          aria-label="在庫を閉じる"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="inventory-category-tabs" role="tablist" aria-label="在庫カテゴリ">
        {inventoryCategories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              className="inventory-category-tab"
              data-inventory-category={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="inventory-panel"
              onClick={() => setActiveCategory(category.id)}
            >
              <span aria-hidden="true">{category.icon}</span>
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>
      <div className="inventory-filter-row">
        <span>表示：</span>
        <button
          className="inventory-filter-button"
          data-inventory-filter="owned"
          type="button"
          aria-pressed={!showAll}
          onClick={() => setShowAll(false)}
        >
          所持あり
        </button>
        <button
          className="inventory-filter-button"
          data-inventory-filter="all"
          type="button"
          aria-pressed={showAll}
          onClick={() => setShowAll(true)}
        >
          すべて
        </button>
      </div>
      <div
        className="inventory-items"
        id="inventory-panel"
        role="tabpanel"
        aria-label={`${inventoryCategories.find((category) => category.id === activeCategory)?.label}の在庫`}
      >
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <div
              key={item.id}
              className="inventory-item"
              data-inventory-item={item.id}
              role="group"
              aria-label={`${item.name} ${item.count}`}
              title={`${item.name} ${item.count}`}
            >
              <span className="inventory-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="inventory-item-name">{item.name}</span>
              <strong>{formatCount(item.count)}</strong>
            </div>
          ))
        ) : (
          <p className="inventory-empty">このカテゴリに所持している項目はありません。</p>
        )}
      </div>
    </section>
  );
}
