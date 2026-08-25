import { useEffect, useState } from "react";
import { getCropName } from "../game/systems/CropSystem";
import { getCropDefinition } from "../game/types/Crop";
import { useGameStore } from "../store/gameStore";
import { CropSelector } from "./CropSelector";
import { InventoryDrawer } from "./InventoryDrawer";

export function FarmControls(): JSX.Element | null {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const selectedCropType = useGameStore((store) => store.selectedCropType);
  const game = useGameStore((store) => store.game);
  const selectCropType = useGameStore((store) => store.selectCropType);
  const [isCropSelectorOpen, setCropSelectorOpen] = useState(false);
  const [isInventoryOpen, setInventoryOpen] = useState(false);

  useEffect(() => {
    if (interactionMode !== "farm") {
      setCropSelectorOpen(false);
      setInventoryOpen(false);
    }
  }, [interactionMode]);

  if (interactionMode !== "farm") return null;

  const selectedCrop = getCropDefinition(selectedCropType);
  const selectedSeeds = game[selectedCrop.seedKey];

  const openCropSelector = (): void => {
    setInventoryOpen(false);
    setCropSelectorOpen(true);
  };

  const openInventory = (): void => {
    setCropSelectorOpen(false);
    setInventoryOpen(true);
  };

  return (
    <section className="farm-controls" aria-label="作物の操作">
      <div className="farm-control-bar">
        <div className="farm-selected-crop" aria-label={`植える作物 ${selectedCrop.name}`}>
          <span className="farm-selected-crop-icon" aria-hidden="true">{selectedCrop.icon}</span>
          <span className="farm-selected-crop-copy">
            <small>植える作物</small>
            <strong>{selectedCrop.name}</strong>
            <span>種 <b>{selectedSeeds.toLocaleString("ja-JP")}</b></span>
          </span>
        </div>
        <div className="farm-control-actions">
          <button
            className="farm-control-button"
            data-action="change-crop"
            type="button"
            aria-expanded={isCropSelectorOpen}
            aria-controls="crop-selector-panel"
            onClick={openCropSelector}
          >
            <span aria-hidden="true">🌱</span>
            <span>作物変更</span>
          </button>
          <button
            className="farm-control-button"
            data-action="open-inventory"
            type="button"
            aria-expanded={isInventoryOpen}
            aria-controls="inventory-drawer-panel"
            onClick={openInventory}
          >
            <span aria-hidden="true">🎒</span>
            <span>在庫</span>
          </button>
        </div>
      </div>
      {isCropSelectorOpen && (
        <div id="crop-selector-panel">
          <CropSelector
            game={game}
            selectedCropType={selectedCropType}
            onSelect={selectCropType}
            onClose={() => setCropSelectorOpen(false)}
          />
        </div>
      )}
      {isInventoryOpen && (
        <div id="inventory-drawer-panel">
          <InventoryDrawer game={game} onClose={() => setInventoryOpen(false)} />
        </div>
      )}
      <div className="farm-control-row">
        <span className="farm-action-copy">
          {`${getCropName(selectedCropType)}の種を空の畑へ（種を1個使用）。成熟した作物は村画面でタップまたはスワイプして収穫`}
        </span>
      </div>
    </section>
  );
}
