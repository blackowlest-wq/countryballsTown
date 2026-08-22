import { useEffect, useState } from "react";
import {
  getCraftingIngredientIcon,
  getCraftingIngredientName,
  getCraftingMaxCraftable,
  getCraftingProductIcon,
  getCraftingProductName,
  getCraftingProductUnit,
  getCraftingRecipe,
} from "../game/systems/CraftingSystem";
import type {
  CraftingIngredientKey,
  CraftingProductType,
} from "../game/types/Crafting";
import { useGameStore } from "../store/gameStore";

interface CraftingShopPanelProps {
  buildingId: string | null;
  products: readonly CraftingProductType[];
  panelClassName: string;
  ariaLabel: string;
  eyebrow: string;
  title: string;
  hint: string;
  close: () => void;
}

export function CraftingShopPanel({
  buildingId,
  products,
  panelClassName,
  ariaLabel,
  eyebrow,
  title,
  hint,
  close,
}: CraftingShopPanelProps): JSX.Element | null {
  const game = useGameStore((store) => store.game);
  const craft = useGameStore((store) => store.craftShopProduct);
  const [selectedProduct, setSelectedProduct] = useState<CraftingProductType>(products[0]);
  const [quantity, setQuantity] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const productName = getCraftingProductName(selectedProduct);
  const productUnit = getCraftingProductUnit(selectedProduct);
  const maxCraftable = getCraftingMaxCraftable(game, selectedProduct);
  const recipe = getCraftingRecipe(selectedProduct);

  useEffect(() => {
    setSelectedProduct(products[0]);
    setQuantity(1);
    setConfirming(false);
  }, [buildingId, products]);

  useEffect(() => {
    setQuantity((current) => Math.max(1, Math.min(current, Math.max(1, maxCraftable))));
    setConfirming(false);
  }, [maxCraftable, selectedProduct]);

  if (!buildingId || products.length === 0) return null;

  const recipeRows = (Object.entries(recipe.ingredients) as Array<[
    CraftingIngredientKey,
    number,
  ]>).map(([ingredient, amount]) => ({
    key: ingredient,
    label: getCraftingIngredientName(ingredient),
    icon: getCraftingIngredientIcon(ingredient),
    amount: amount * quantity,
    stock: game[ingredient],
  }));
  const canCraft = maxCraftable > 0;

  return (
    <section className={`floating-panel crafting-shop-panel ${panelClassName}`} aria-label={ariaLabel}>
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">{hint}</p>

      <div className="pizza-product-selection" role="group" aria-label="作るものを選ぶ">
        {products.map((productType) => (
          <button
            key={productType}
            type="button"
            className="pizza-product-option"
            data-product={productType}
            aria-pressed={selectedProduct === productType}
            onClick={() => {
              setSelectedProduct(productType);
              setConfirming(false);
            }}
          >
            <span className="factory-product-icon" aria-hidden="true">
              {getCraftingProductIcon(productType)}
            </span>
            <span>{getCraftingProductName(productType)}</span>
          </button>
        ))}
      </div>

      <label className="pizza-quantity-field">
        <span>いくつ作りますか？</span>
        <span className="pizza-quantity-control">
          <button
            type="button"
            aria-label={`${productName}を1${productUnit}減らす`}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max={Math.max(1, maxCraftable)}
            value={quantity}
            aria-label={`${productName}の生産数`}
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1);
              setConfirming(false);
            }}
          />
          <button
            type="button"
            aria-label={`${productName}を1${productUnit}増やす`}
            onClick={() => setQuantity((current) => Math.min(Math.max(1, maxCraftable), current + 1))}
            disabled={!canCraft || quantity >= maxCraftable}
          >
            ＋
          </button>
          <button
            type="button"
            className="pizza-quantity-shortcut"
            aria-label={`${productName}を10${productUnit}増やす`}
            onClick={() => {
              setQuantity((current) => Math.min(Math.max(1, maxCraftable), current + 10));
              setConfirming(false);
            }}
            disabled={!canCraft || quantity >= maxCraftable}
          >
            ＋10個
          </button>
        </span>
      </label>
      <p className="pizza-max-copy">作れる最大数：{maxCraftable}{productUnit}</p>

      <div className="pizza-recipe" aria-label="消費材料">
        <p className="pizza-recipe-heading">消費材料（{quantity}{productUnit}分）</p>
        <div className="pizza-recipe-list">
          {recipeRows.map((row) => (
            <span
              key={row.key}
              className="pizza-recipe-item"
              aria-label={`${row.label}${row.amount}個（所持${row.stock}個）`}
            >
              <span aria-hidden="true">{row.icon}</span>
              <span>{row.label}</span>
              <strong>{row.amount}</strong>
              <small>/ {row.stock}</small>
            </span>
          ))}
        </div>
      </div>

      {confirming ? (
        <div className="pizza-confirmation" role="alert">
          <p>上の材料を消費して、{productName}を{quantity}{productUnit}作りますか？</p>
          <div className="panel-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                if (!craft(buildingId, selectedProduct, quantity)) setConfirming(false);
              }}
            >
              この材料で作る
            </button>
            <button className="subtle-button" type="button" onClick={() => setConfirming(false)}>
              数量を変更
            </button>
          </div>
        </div>
      ) : (
        <button
          className="primary-button full-button"
          type="button"
          disabled={!canCraft || quantity > maxCraftable}
          onClick={() => setConfirming(true)}
        >
          材料を確認する
        </button>
      )}
    </section>
  );
}
