import { getBuildingDefinition } from "../game/data/buildings";
import { useGameStore } from "../store/gameStore";

export function BuildingPanel(): JSX.Element | null {
  const selectedId = useGameStore((store) => store.selectedBuildingId);
  const mode = useGameStore((store) => store.interactionMode);
  const building = useGameStore((store) => store.game.buildings.find((item) => item.id === selectedId));
  const beginMove = useGameStore((store) => store.beginMove);
  const remove = useGameStore((store) => store.removeSelectedBuilding);
  const cancel = useGameStore((store) => store.cancelInteraction);
  if (!building || mode === "build") return null;
  const definition = getBuildingDefinition(building.buildingId);
  if (!definition) return null;

  return (
    <section className="floating-panel building-panel" aria-label="建物の操作">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">SELECTED PLACE</p>
          <h2>{definition.name}</h2>
        </div>
        <button className="icon-button" type="button" onClick={cancel} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">{definition.description}</p>
      {mode === "move" ? (
        <button className="subtle-button full-button" type="button" onClick={cancel}>移動をキャンセル</button>
      ) : (
        <div className="panel-actions">
          {definition.movable !== false && (
            <button className="primary-button" type="button" onClick={() => beginMove(building.id)}>移動する</button>
          )}
          {definition.removable !== false && (
            <button className="danger-button" type="button" onClick={() => remove()}>撤去する</button>
          )}
        </div>
      )}
    </section>
  );
}
