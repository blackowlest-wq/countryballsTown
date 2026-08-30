import { useEffect } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { useSaveGame } from "../hooks/useSaveGame";
import { useGameStore } from "../store/gameStore";
import { BuildingPanel } from "../ui/BuildingPanel";
import { BottomMenu } from "../ui/BottomMenu";
import { BuildMenu } from "../ui/BuildMenu";
import { GameHud } from "../ui/GameHud";
import { FarmControls } from "../ui/FarmControls";
import { MilkFactoryPanel } from "../ui/MilkFactoryPanel";
import { PorkFactoryPanel } from "../ui/PorkFactoryPanel";
import { PizzaShopPanel } from "../ui/PizzaShopPanel";
import { WheatFactoryPanel } from "../ui/WheatFactoryPanel";
import { BakeryPanel } from "../ui/BakeryPanel";
import { RiceShopPanel } from "../ui/RiceShopPanel";
import { FishShopPanel } from "../ui/FishShopPanel";
import { ChineseRestaurantPanel } from "../ui/ChineseRestaurantPanel";
import { BurgerShopPanel } from "../ui/BurgerShopPanel";
import { MapTravelPanel } from "../ui/MapTravelPanel";
import { ResidentPanel } from "../ui/ResidentPanel";
import { EncyclopediaPanel } from "../ui/EncyclopediaPanel";
import { FishingPromptPanel } from "../ui/FishingPromptPanel";
import { FishingGamePanel } from "../ui/FishingGamePanel";
import { CaveMiningLauncher } from "../ui/CaveMiningLauncher";
import { CaveMiningGameWindow } from "../ui/CaveMiningGameWindow";
import { VillageScene } from "../scene/VillageScene";
import { OrderBoardPanel } from "../ui/OrderBoardPanel";

export function App(): JSX.Element {
  const notice = useGameStore((store) => store.notice);
  const dismissNotice = useGameStore((store) => store.dismissNotice);
  useGameLoop();
  useSaveGame();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismissNotice, 6_000);
    return () => window.clearTimeout(timer);
  }, [dismissNotice, notice]);

  return (
    <main className="app-shell">
      <VillageScene />
      <GameHud />
      <BuildMenu />
      <ResidentPanel />
      <BuildingPanel />
      <MilkFactoryPanel />
      <PorkFactoryPanel />
      <WheatFactoryPanel />
      <PizzaShopPanel />
      <BakeryPanel />
      <RiceShopPanel />
      <FishShopPanel />
      <ChineseRestaurantPanel />
      <BurgerShopPanel />
      <MapTravelPanel />
      <EncyclopediaPanel />
      <FishingPromptPanel />
      <FishingGamePanel />
      <CaveMiningLauncher />
      <CaveMiningGameWindow />
      <OrderBoardPanel />
      <FarmControls />
      <div className="interaction-hint">
        <span className="hint-hand">✦</span>
        <span>ドラッグでマップを見渡せます</span>
      </div>
      <BottomMenu />
    </main>
  );
}
