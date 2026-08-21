import { useEffect, useState } from "react";
import { getPizzaMaxCraftable, PIZZA_RECIPE } from "../game/systems/PizzaSystem";
import { useGameStore } from "../store/gameStore";

const pizzaRecipeRows = [
  { key: "bacon", label: "ベーコン", icon: "🥓" },
  { key: "cheese", label: "チーズ", icon: "🧀" },
  { key: "tomatoes", label: "トマト", icon: "🍅" },
  { key: "wheat", label: "小麦", icon: "🌾" },
] as const;

export function PizzaShopPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.pizzaShopPanelBuildingId);
  const game = useGameStore((store) => store.game);
  const craft = useGameStore((store) => store.craftPizza);
  const close = useGameStore((store) => store.closePizzaShopPanel);
  const [quantity, setQuantity] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const maxCraftable = getPizzaMaxCraftable(game);

  useEffect(() => {
    setQuantity((current) => Math.max(1, Math.min(current, Math.max(1, maxCraftable))));
    setConfirming(false);
  }, [buildingId, maxCraftable]);

  if (!buildingId) return null;

  const recipeRows = pizzaRecipeRows.map((row) => ({
    ...row,
    amount: PIZZA_RECIPE[row.key] * quantity,
    stock: game[row.key],
  }));
  const canCraft = maxCraftable > 0;

  return (
    <section className="floating-panel pizza-shop-panel" aria-label="ピザ屋の設定">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">PIZZA SHOP</p>
          <h2>ピザ屋</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">材料をそろえてピザを作り、来訪客に販売します。</p>

      <div className="pizza-product-selection" role="group" aria-label="作るものを選ぶ">
        <button
          type="button"
          className="pizza-product-option"
          data-product="pizza"
          aria-pressed="true"
          onClick={() => setConfirming(false)}
        >
          <span className="factory-product-icon" aria-hidden="true">🍕</span>
          <span>ピザ</span>
        </button>
      </div>

      <label className="pizza-quantity-field">
        <span>いくつ作りますか？</span>
        <span className="pizza-quantity-control">
          <button
            type="button"
            aria-label="ピザを1枚減らす"
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
            aria-label="ピザの生産数"
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1);
              setConfirming(false);
            }}
          />
          <button
            type="button"
            aria-label="ピザを1枚増やす"
            onClick={() => setQuantity((current) => Math.min(Math.max(1, maxCraftable), current + 1))}
            disabled={!canCraft || quantity >= maxCraftable}
          >
            ＋
          </button>
          <button
            type="button"
            className="pizza-quantity-shortcut"
            aria-label="ピザを10枚増やす"
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
      <p className="pizza-max-copy">作れる最大数：{maxCraftable}枚</p>

      <div className="pizza-recipe" aria-label="消費材料">
        <p className="pizza-recipe-heading">消費材料（{quantity}枚分）</p>
        <div className="pizza-recipe-list">
          {recipeRows.map((row) => (
            <span key={row.key} className="pizza-recipe-item" aria-label={`${row.label}${row.amount}個（所持${row.stock}個）`}>
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
          <p>上の材料を消費して、ピザを{quantity}枚作りますか？</p>
          <div className="panel-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                if (!craft(buildingId, quantity)) setConfirming(false);
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
