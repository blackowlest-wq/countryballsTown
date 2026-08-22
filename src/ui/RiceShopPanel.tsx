import { RICE_SHOP_PRODUCT_TYPES } from "../game/systems/RiceShopSystem";
import { useGameStore } from "../store/gameStore";
import { CraftingShopPanel } from "./CraftingShopPanel";

export function RiceShopPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.riceShopPanelBuildingId);
  const close = useGameStore((store) => store.closeRiceShopPanel);
  return (
    <CraftingShopPanel
      buildingId={buildingId}
      products={RICE_SHOP_PRODUCT_TYPES}
      panelClassName="rice-shop-panel"
      ariaLabel="ごはん屋の設定"
      eyebrow="RICE SHOP"
      title="ごはん屋"
      hint="おにぎりやオムライスを作り、来訪客に販売します。"
      close={close}
    />
  );
}
