import { getCountryDefinition } from "../game/data/countries";
import { getMapDefinition } from "../game/data/maps";
import { getProductDefinition } from "../game/data/productCatalog";
import { getInventoryCount } from "../game/systems/InventorySystem";
import {
  canFulfillMarketOrder,
  getMarketOrderNormalValue,
} from "../game/systems/MarketOrderSystem";
import { getResidentStatusLabel } from "../game/systems/ResidentSystem";
import { useGameStore } from "../store/gameStore";

export function ResidentPanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isResidentPanelOpen);
  const game = useGameStore((store) => store.game);
  const selectedResidentId = useGameStore((store) => store.selectedResidentId);
  const setOpen = useGameStore((store) => store.setResidentPanelOpen);
  const selectResident = useGameStore((store) => store.selectResident);
  const fulfill = useGameStore((store) => store.fulfillMarketOrder);
  if (!open) return null;
  const { currentMap, marketOrders, residents } = game;
  const selected = residents.find((resident) => resident.id === selectedResidentId);
  const mapDefinition = getMapDefinition(currentMap);

  return (
    <section className="floating-panel resident-panel" aria-label="住民パネル">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RESIDENTS</p>
          <h2>住民たち</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="閉じる">×</button>
      </div>
      <div className="resident-list">
        {residents.map((resident) => {
          const country = getCountryDefinition(resident.countryId);
          return (
            <button
              type="button"
              key={resident.id}
              className={`resident-row ${selectedResidentId === resident.id ? "is-selected" : ""}`}
              onClick={() => selectResident(resident.id)}
            >
              <span className="resident-dot" style={{ background: country?.accentColor ?? "#8ca8bb" }} />
              <span>
                <strong>{country?.name ?? resident.countryId}</strong>
                <small>{getResidentStatusLabel(resident)}</small>
              </span>
              <span className="row-chevron">›</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="resident-detail">
          <p className="detail-country">{getCountryDefinition(selected.countryId)?.name}</p>
          <p className="detail-status"><span className="status-dot" /> {getResidentStatusLabel(selected)}</p>
          <p className="detail-copy">
            {currentMap === "village"
              ? "村の中を自由に歩きながら、好きな場所でひと休みします。"
              : currentMap === "sea-and-river"
                ? "海岸や川辺を歩きながら、釣りや川遊びを楽しみます。"
                : `${mapDefinition.name}を歩きながら、景色を楽しみます。`}
          </p>
        </div>
      )}
      <section className="resident-orders" aria-label="注文">
        <div className="resident-orders-heading">
          <div>
            <p className="eyebrow">MARKET ORDERS</p>
            <h3>納品依頼</h3>
          </div>
          <span>{marketOrders.length}件</span>
        </div>
        <p className="panel-hint">住民からの注文をここで受け、品物を納品できます。</p>
        <div className="order-board-list">
          {marketOrders.map((order) => {
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
    </section>
  );
}
