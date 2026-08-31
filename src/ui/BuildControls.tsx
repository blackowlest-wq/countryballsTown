import { useEffect, useState } from "react";
import { getBuildingDefinition } from "../game/data/buildings";
import { getDistrictDefinition } from "../game/data/districts";
import { useGameStore } from "../store/gameStore";
import { BuildingCost, BuildingSelector } from "./BuildingSelector";

export function BuildControls(): JSX.Element | null {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const selectedBuildingId = useGameStore((store) => store.selectedBuildingId);
  const selectedDistrictId = useGameStore((store) => store.selectedDistrictId);
  const cancelInteraction = useGameStore((store) => store.cancelInteraction);
  const [isBuildingSelectorOpen, setBuildingSelectorOpen] = useState(false);

  useEffect(() => {
    if (interactionMode !== "build") setBuildingSelectorOpen(false);
  }, [interactionMode]);

  if (interactionMode !== "build" || !selectedBuildingId) return null;

  const selectedBuilding = getBuildingDefinition(selectedBuildingId);
  if (!selectedBuilding) return null;
  const selectedDistrict = getDistrictDefinition(selectedDistrictId);

  return (
    <section className="build-controls" aria-label="建築の操作">
      <div className="build-control-bar">
        <div className="build-selected-building" aria-label={`建築する建物 ${selectedBuilding.name}`}>
          <span
            className={`building-icon build-selected-building-icon building-icon-${selectedBuilding.category} building-icon-${selectedBuilding.id}`}
            aria-hidden="true"
          >
            {selectedBuilding.menuIcon}
          </span>
          <span className="build-selected-building-copy">
            <small>{selectedDistrict?.name ?? "建築物"}</small>
            <strong>{selectedBuilding.name}</strong>
            <span className="build-selected-building-cost">
              <span>費用</span>
              <BuildingCost building={selectedBuilding} />
            </span>
          </span>
        </div>
        <div className="build-control-actions">
          <button
            className="farm-control-button"
            data-action="change-building"
            type="button"
            aria-expanded={isBuildingSelectorOpen}
            aria-controls="building-selector-panel"
            onClick={() => setBuildingSelectorOpen(true)}
          >
            <span aria-hidden="true">🏠</span>
            <span>建物変更</span>
          </button>
        </div>
      </div>
      {isBuildingSelectorOpen && (
        <div id="building-selector-panel">
          <BuildingSelector
            browseDistrictOnly
            onClose={() => setBuildingSelectorOpen(false)}
          />
        </div>
      )}
      <div className="build-control-row">
        <span className="build-action-copy">選択中の建物を空いているセルへ配置</span>
        <button
          className="build-cancel-button"
          data-action="cancel-build"
          type="button"
          onClick={cancelInteraction}
        >
          配置をやめる
        </button>
      </div>
    </section>
  );
}
