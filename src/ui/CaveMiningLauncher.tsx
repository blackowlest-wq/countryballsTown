import { useGameStore } from "../store/gameStore";
import { CaveDrillIcon } from "./CaveDrillIcon";

export function CaveMiningLauncher(): JSX.Element | null {
  const currentMap = useGameStore((store) => store.game.currentMap);
  const openGame = useGameStore((store) => store.openCaveMiningGame);
  const isOpen = useGameStore((store) => store.isCaveMiningGameOpen);
  if (currentMap !== "cave" || isOpen) return null;

  return (
    <section className="cave-mining-launcher" aria-label="地面採掘ゲームを開く">
      <span className="cave-mining-launcher-icon"><CaveDrillIcon /></span>
      <span className="cave-mining-launcher-copy">
        <strong>地面採掘ゲーム</strong>
        <small>洞窟を下や横に掘り進もう</small>
      </span>
      <button type="button" className="primary-button" onClick={openGame}>
        開く
      </button>
    </section>
  );
}
