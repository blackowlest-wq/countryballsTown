import { FISH_SHOP_PRODUCT_TYPES } from "../game/systems/FishShopSystem";
import { useGameStore } from "../store/gameStore";
import { CraftingShopPanel } from "./CraftingShopPanel";

export function FishShopPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.fishShopPanelBuildingId);
  const close = useGameStore((store) => store.closeFishShopPanel);
  return (
    <CraftingShopPanel
      buildingId={buildingId}
      products={FISH_SHOP_PRODUCT_TYPES}
      panelClassName="fish-shop-panel"
      ariaLabel="魚屋の設定"
      eyebrow="FISH SHOP"
      title="魚屋"
      hint="釣った魚から焼き魚や海鮮丼を作り、来訪客に販売します。"
      close={close}
    />
  );
}
