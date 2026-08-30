import { getProductsForStore } from "../game/data/productCatalog";
import { useGameStore } from "../store/gameStore";
import { CraftingShopPanel } from "./CraftingShopPanel";

const chineseRestaurantProducts = getProductsForStore("chinese-restaurant");

export function ChineseRestaurantPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.chineseRestaurantPanelBuildingId);
  const close = useGameStore((store) => store.closeChineseRestaurantPanel);
  return (
    <CraftingShopPanel
      buildingId={buildingId}
      products={chineseRestaurantProducts}
      panelClassName="chinese-restaurant-panel"
      ariaLabel="中華食堂の設定"
      eyebrow="CHINESE RESTAURANT"
      title="中華食堂"
      hint="チャーハンを作り、来訪客に販売します。"
      close={close}
    />
  );
}
