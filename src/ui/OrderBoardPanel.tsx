import { getProductDefinition } from "../game/data/productCatalog";
import { getInventoryCount } from "../game/systems/InventorySystem";
import {
  canFulfillMarketOrder,
  getMarketOrderNormalValue,
} from "../game/systems/MarketOrderSystem";
import { useGameStore } from "../store/gameStore";

export function OrderBoardPanel(): JSX.Element | null {
  const isOpen = useGameStore((store) => store.isMarketOrderOpen);
  const game = useGameStore((store) => store.game);
  const fulfill = useGameStore((store) => store.fulfillMarketOrder);
  const close = useGameStore((store) => store.closeMarketOrderBoard);
  if (!isOpen) return null;

  return (
    <section className="floating-panel order-board-panel" aria-label="注文板">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">ORDER BOARD</p>
          <h2>注文板</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="注文板を閉じる">×</button>
      </div>
      <p className="panel-hint">常時3件の注文があります。通常販売より高い報酬で納品できます。</p>
      <div className="order-board-list">
        {game.marketOrders.map((order) => {
          const canFulfill = canFulfillMarketOrder(game, order);
          return (
            <article className={`order-card ${canFulfill ? "is-ready" : "is-shortage"}`} key={order.id}>
              <div className="order-card-heading">
                <strong>納品オーダー</strong>
                <span className={canFulfill ? "order-status-ready" : "order-status-shortage"}>
                  {canFulfill ? "納品できます" : "材料不足"}
                </span>
              </div>
              <div className="order-item-list">
                {order.items.map((item) => {
                  const definition = getProductDefinition(item.productType);
                  const stock = getInventoryCount(game, item.productType);
                  return (
                    <div className="order-item" key={item.productType}>
                      <span className="order-item-icon" aria-hidden="true">{definition?.icon ?? "📦"}</span>
                      <span className="order-item-copy">
                        <strong>{definition?.name ?? item.productType}</strong>
                        <small>必要 {item.quantity}{definition?.unit ?? "個"} ／ 所持 {stock}{definition?.unit ?? "個"}</small>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="order-reward-row">
                <span>通常価値 <strong>{getMarketOrderNormalValue(order)}コイン</strong></span>
                <span className="order-reward">報酬 <strong>{order.rewardCoins}コイン</strong></span>
              </div>
              <button
                className="primary-button full-button order-fulfill-button"
                type="button"
                disabled={!canFulfill}
                onClick={() => fulfill(order.id)}
              >
                {canFulfill ? "納品する" : "材料をそろえる"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
