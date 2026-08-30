import { getProductsForStore } from "../game/data/productCatalog";
import { useGameStore } from "../store/gameStore";
import { CraftingShopPanel } from "./CraftingShopPanel";

const burgerShopProducts = getProductsForStore("burger-shop");

export function BurgerShopPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.burgerShopPanelBuildingId);
  const close = useGameStore((store) => store.closeBurgerShopPanel);
  return (
    <CraftingShopPanel
      buildingId={buildingId}
      products={burgerShopProducts}
      panelClassName="burger-shop-panel"
      ariaLabel="ハンバーガーショップの設定"
      eyebrow="BURGER SHOP"
      title="ハンバーガーショップ"
      hint="ハンバーガーやパンケーキを作り、来訪客に販売します。"
      close={close}
    />
  );
}
