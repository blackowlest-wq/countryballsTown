import { getCountryDefinition } from "../game/data/countries";
import { getMapDefinition } from "../game/data/maps";
import { getResidentStatusLabel } from "../game/systems/ResidentSystem";
import { useGameStore } from "../store/gameStore";

export function ResidentPanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isResidentPanelOpen);
  const residents = useGameStore((store) => store.game.residents);
  const currentMap = useGameStore((store) => store.game.currentMap);
  const selectedResidentId = useGameStore((store) => store.selectedResidentId);
  const setOpen = useGameStore((store) => store.setResidentPanelOpen);
  const selectResident = useGameStore((store) => store.selectResident);
  if (!open) return null;
  const selected = residents.find((resident) => resident.id === selectedResidentId);
  const mapDefinition = getMapDefinition(currentMap);

  return (
    <section className="floating-panel resident-panel" aria-label="住民パネル">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RESIDENTS</p>
          <h2>住民たち</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="閉じる">×</button>
      </div>
      <div className="resident-list">
        {residents.map((resident) => {
          const country = getCountryDefinition(resident.countryId);
          return (
            <button
              type="button"
              key={resident.id}
              className={`resident-row ${selectedResidentId === resident.id ? "is-selected" : ""}`}
              onClick={() => selectResident(resident.id)}
            >
              <span className="resident-dot" style={{ background: country?.accentColor ?? "#8ca8bb" }} />
              <span>
                <strong>{country?.name ?? resident.countryId}</strong>
                <small>{getResidentStatusLabel(resident)}</small>
              </span>
              <span className="row-chevron">›</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="resident-detail">
          <p className="detail-country">{getCountryDefinition(selected.countryId)?.name}</p>
          <p className="detail-status"><span className="status-dot" /> {getResidentStatusLabel(selected)}</p>
          <p className="detail-copy">
            {currentMap === "village"
              ? "村の中を自由に歩きながら、好きな場所でひと休みします。"
              : currentMap === "sea-and-river"
                ? "海岸や川辺を歩きながら、釣りや川遊びを楽しみます。"
                : `${mapDefinition.name}を歩きながら、景色を楽しみます。`}
          </p>
        </div>
      )}
    </section>
  );
}
