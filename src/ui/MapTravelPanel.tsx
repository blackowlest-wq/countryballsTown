import { getMapDefinition, mapDefinitions } from "../game/data/maps";
import { useGameStore } from "../store/gameStore";

export function MapTravelPanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isMapTravelOpen);
  const currentMap = useGameStore((store) => store.game.currentMap);
  const close = useGameStore((store) => store.closeMapTravel);
  const travelToMap = useGameStore((store) => store.travelToMap);
  if (!open) return null;

  const currentDefinition = getMapDefinition(currentMap);

  return (
    <section className="floating-panel map-travel-panel" aria-label="移動先を選ぶ">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRAVEL</p>
          <h2>移動する</h2>
        </div>
        <button className="icon-button" type="button" onClick={close} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">現在地は{currentDefinition.name}。行き先を選んで移動できます。</p>
      <div className="map-travel-list" role="list">
        {mapDefinitions.map((definition) => {
          const isCurrent = definition.id === currentMap;
          return (
            <button
              key={definition.id}
              type="button"
              className={`map-travel-option ${isCurrent ? "is-current" : ""}`}
              data-map={definition.id}
              aria-current={isCurrent ? "location" : undefined}
              disabled={isCurrent}
              onClick={() => travelToMap(definition.id)}
            >
              <span className="map-travel-icon" aria-hidden="true">{definition.icon}</span>
              <span className="map-travel-copy">
                <strong>{definition.name}</strong>
                <small>{definition.description}</small>
              </span>
              <span className="map-travel-status">{isCurrent ? "現在地" : "移動"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
