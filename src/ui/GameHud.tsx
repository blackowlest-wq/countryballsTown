import { useState } from "react";
import { countBuildings } from "../game/systems/BuildingSystem";
import { getMapDefinition } from "../game/data/maps";
import { useGameStore } from "../store/gameStore";
import { CoinDisplay } from "./CoinDisplay";
import { VillageLevelDisplay } from "./VillageLevelDisplay";
import { ResidentRequestCard } from "./ResidentRequestCard";
import { SettingsPanel } from "./SettingsPanel";

export function GameHud(): JSX.Element {
  const game = useGameStore((store) => store.game);
  const notice = useGameStore((store) => store.notice);
  const dismissNotice = useGameStore((store) => store.dismissNotice);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const treeCount = countBuildings(game, "tree");
  const flowerCount = countBuildings(game, "flower");
  const onsenCount = countBuildings(game, "onsen");
  const pizzaShopCount = countBuildings(game, "pizza-shop");
  const chineseRestaurantCount = countBuildings(game, "chinese-restaurant");
  const isVillage = game.currentMap === "village";
  const mapDefinition = getMapDefinition(game.currentMap);
  const nextGoal = !isVillage
    ? mapDefinition.description
    : game.villageLevel === 1
      ? `木 ${treeCount}/3  ・  花 ${flowerCount}/3`
      : game.villageLevel === 2
        ? `住民 ${game.residents.length}/2  ・  温泉 ${onsenCount}/1`
        : game.villageLevel === 3
          ? `ピザ屋 ${pizzaShopCount}/1  ・  イタリアの住民をおもてなし`
          : game.villageLevel === 4
            ? `中華食堂 ${chineseRestaurantCount}/1  ・  中国の住民をおもてなし`
            : "5つの国の住民が楽しく暮らしています";

  return (
    <>
      <header className="top-hud">
        <VillageLevelDisplay level={game.villageLevel} />
        <div className="hud-right">
          <CoinDisplay coins={game.coins} />
          <div className="mood-pill"><span>●</span> のんびり暮らし中</div>
          <button
            className="settings-launcher"
            type="button"
            aria-label="設定を開く"
            aria-expanded={isSettingsOpen}
            aria-controls="settings-panel"
            onClick={() => setSettingsOpen(true)}
          >
            <span aria-hidden="true">⚙</span>
            <span>設定</span>
          </button>
        </div>
      </header>
      <div className="goal-card">
        <span className="goal-sparkle">✦</span>
        <div>
          <p className="goal-label">{isVillage ? "つぎの村の目標" : mapDefinition.name}</p>
          <p className="goal-text">{nextGoal}</p>
        </div>
      </div>
      <ResidentRequestCard />
      <SettingsPanel open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      {notice && (
        <div className="notice-banner" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="通知を閉じる" onClick={dismissNotice}>×</button>
        </div>
      )}
    </>
  );
}
