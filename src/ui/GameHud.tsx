import { countBuildings } from "../game/systems/BuildingSystem";
import { useGameStore } from "../store/gameStore";
import { BgmToggle } from "./BgmToggle";
import { CoinDisplay } from "./CoinDisplay";
import { VillageLevelDisplay } from "./VillageLevelDisplay";
import { ResidentRequestCard } from "./ResidentRequestCard";
import { ProduceDisplay } from "./ProduceDisplay";

export function GameHud(): JSX.Element {
  const game = useGameStore((store) => store.game);
  const notice = useGameStore((store) => store.notice);
  const dismissNotice = useGameStore((store) => store.dismissNotice);
  const treeCount = countBuildings(game, "tree");
  const flowerCount = countBuildings(game, "flower");
  const onsenCount = countBuildings(game, "onsen");
  const nextGoal = game.villageLevel === 1
    ? `木 ${treeCount}/3  ・  花 ${flowerCount}/3`
    : game.villageLevel === 2
      ? `住民 ${game.residents.length}/2  ・  温泉 ${onsenCount}/1`
      : "村のみんなが楽しく暮らしています";

  return (
    <>
      <header className="top-hud">
        <VillageLevelDisplay level={game.villageLevel} />
        <div className="hud-right">
          <CoinDisplay coins={game.coins} />
          <ProduceDisplay
            wheatSeeds={game.wheatSeeds}
            wheat={game.wheat}
            milk={game.milk}
          />
          <div className="mood-pill"><span>●</span> のんびり暮らし中</div>
          <BgmToggle />
        </div>
      </header>
      <div className="goal-card">
        <span className="goal-sparkle">✦</span>
        <div>
          <p className="goal-label">つぎの村の目標</p>
          <p className="goal-text">{nextGoal}</p>
        </div>
      </div>
      <ResidentRequestCard />
      {notice && (
        <div className="notice-banner" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="通知を閉じる" onClick={dismissNotice}>×</button>
        </div>
      )}
    </>
  );
}
