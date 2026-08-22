import { BAKERY_PRODUCT_TYPES } from "../game/systems/BakerySystem";
import { CraftingShopPanel } from "./CraftingShopPanel";
import { useGameStore } from "../store/gameStore";

export function BakeryPanel(): JSX.Element | null {
  const buildingId = useGameStore((store) => store.bakeryPanelBuildingId);
  const close = useGameStore((store) => store.closeBakeryPanel);
  return (
    <CraftingShopPanel
      buildingId={buildingId}
      products={BAKERY_PRODUCT_TYPES}
      panelClassName="bakery-panel"
      ariaLabel="パン屋の設定"
      eyebrow="BAKERY"
      title="パン屋"
      hint="パンやパンを使った商品を作り、来訪客に販売します。"
      close={close}
    />
  );
}
