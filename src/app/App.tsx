import { useEffect } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { useSaveGame } from "../hooks/useSaveGame";
import { useGameStore } from "../store/gameStore";
import { BuildingPanel } from "../ui/BuildingPanel";
import { BottomMenu } from "../ui/BottomMenu";
import { BuildMenu } from "../ui/BuildMenu";
import { GameHud } from "../ui/GameHud";
import { ResidentPanel } from "../ui/ResidentPanel";
import { VillageScene } from "../scene/VillageScene";

export function App(): JSX.Element {
  const notice = useGameStore((store) => store.notice);
  const dismissNotice = useGameStore((store) => store.dismissNotice);
  const interactionMode = useGameStore((store) => store.interactionMode);
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
      <div className={`interaction-hint ${interactionMode === "farm" ? "farm-hint" : ""}`}>
        <span className="hint-hand">{interactionMode === "farm" ? "🌾" : "✦"}</span>
        <span>
          {interactionMode === "farm"
            ? "空き地をなぞって種まき・実った小麦を収穫"
            : "ドラッグで村を見渡せます"}
        </span>
      </div>
      <BottomMenu />
    </main>
  );
}
