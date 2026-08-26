import type { GameState } from "../game/types/Village";
import { cropDefinitions, type CropType } from "../game/types/Crop";
import { getInventoryCount } from "../game/systems/InventorySystem";

interface CropSelectorProps {
  game: GameState;
  selectedCropType: CropType;
  onSelect: (cropType: CropType) => void;
  onClose: () => void;
}

export function CropSelector({
  game,
  selectedCropType,
  onSelect,
  onClose,
}: CropSelectorProps): JSX.Element {
  const definitions = Object.values(cropDefinitions);

  return (
    <section
      className="crop-selector"
      data-panel="crop-selector"
      aria-label="植える作物を選ぶ"
    >
      <div className="crop-selector-heading">
        <div>
          <strong>作物を選ぶ</strong>
          <small>種がある作物を選ぶと、すぐに植え付けできます</small>
        </div>
        <button
          className="farm-panel-close"
          type="button"
          aria-label="作物選択を閉じる"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="crop-inventory" role="group" aria-label="植える作物の一覧">
        {definitions.map((definition) => {
          const seeds = game[definition.seedKey];
          const harvested = getInventoryCount(game, definition.harvestKey);
          const isSelected = selectedCropType === definition.type;
          const isUnavailable = seeds <= 0;
          const label = `${definition.name}の種を選ぶ。種 ${seeds}、収穫 ${harvested}${
            isUnavailable ? "。種なし" : ""
          }`;

          return (
            <button
              key={definition.type}
              className="crop-choice-button"
              data-crop={definition.type}
              type="button"
              aria-label={label}
              aria-pressed={isSelected}
              aria-disabled={isUnavailable}
              disabled={isUnavailable}
              title={label}
              onClick={() => {
                onSelect(definition.type);
                onClose();
              }}
            >
              <span className="crop-choice-icon" aria-hidden="true">{definition.icon}</span>
              <span className="crop-choice-copy">
                <strong>{definition.name}</strong>
                <span className="crop-stock-row">
                  <span>種 <b>{seeds.toLocaleString("ja-JP")}</b></span>
                  <span>収穫 <b>{harvested.toLocaleString("ja-JP")}</b></span>
                </span>
              </span>
              <span className="crop-choice-check" aria-hidden="true">{isSelected ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
