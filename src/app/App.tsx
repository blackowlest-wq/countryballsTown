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
import { ResidentPanel } from "../ui/ResidentPanel";
import { VillageScene } from "../scene/VillageScene";

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
      <FarmControls />
      <div className="interaction-hint">
        <span className="hint-hand">✦</span>
        <span>ドラッグで村を見渡せます</span>
      </div>
      <BottomMenu />
    </main>
  );
}
