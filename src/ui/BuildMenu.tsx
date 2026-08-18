import { buildingDefinitions, getBuildingDefinition, playerBuildingIds } from "../game/data/buildings";
import { useGameStore } from "../store/gameStore";

export function BuildMenu(): JSX.Element | null {
  const isOpen = useGameStore((store) => store.isBuildMenuOpen);
  const game = useGameStore((store) => store.game);
  const setOpen = useGameStore((store) => store.setBuildMenuOpen);
  const beginBuild = useGameStore((store) => store.beginBuild);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const cancelInteraction = useGameStore((store) => store.cancelInteraction);
  if (!isOpen) return null;

  const available = playerBuildingIds
    .filter((buildingId) => game.unlockedBuildings.includes(buildingId))
    .map((buildingId) => getBuildingDefinition(buildingId))
    .filter((definition): definition is (typeof buildingDefinitions)[number] => Boolean(definition));

  return (
    <section className="floating-panel build-menu" aria-label="建築メニュー">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MAKE YOUR VILLAGE</p>
          <h2>建築する</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">建物を選んでから、村の好きなセルをクリック</p>
      <div className="building-list">
        {available.map((building) => (
          <button
            key={building.id}
            type="button"
            className={`building-option ${interactionMode === "build" ? "is-selectable" : ""}`}
            onClick={() => beginBuild(building.id)}
          >
            <span className={`building-icon building-icon-${building.id}`}>{building.id === "tree" ? "♣" : building.id === "flower" ? "✿" : building.id === "onsen" ? "♨" : building.id === "torii" ? "⛩" : "🍕"}</span>
            <span className="building-option-copy">
              <strong>{building.name}</strong>
              <small>{building.description}</small>
            </span>
            <span className="building-cost"><span className="tiny-coin">✦</span>{building.cost}</span>
          </button>
        ))}
      </div>
      {interactionMode !== "inspect" && (
        <button className="subtle-button full-button" type="button" onClick={cancelInteraction}>配置モードをやめる</button>
      )}
    </section>
  );
}
