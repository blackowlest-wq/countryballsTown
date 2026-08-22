import { CraftingShopPanel } from "./CraftingShopPanel";
import { useGameStore } from "../store/gameStore";

const pizzaProducts = ["pizza"] as const;

export function PizzaShopPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.pizzaShopPanelBuildingId);
  const close = useGameStore((store) => store.closePizzaShopPanel);
  return (
    <CraftingShopPanel
      buildingId={buildingId}
      products={pizzaProducts}
      panelClassName="pizza-shop-panel"
      ariaLabel="ピザ屋の設定"
      eyebrow="PIZZA SHOP"
      title="ピザ屋"
      hint="材料をそろえてピザを作り、来訪客に販売します。"
      close={close}
    />
  );
}
