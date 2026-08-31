import {
  buildingCategoryDefinitions,
  buildingDefinitions,
  getBuildingDefinition,
  isLivestockBuildingId,
  MAX_LIVESTOCK_COUNT,
  playerBuildingIds,
} from "../game/data/buildings";
import { getMiningResourceDefinition } from "../game/data/mining";
import { buildDistrictDefinitions, getDistrictDefinition } from "../game/data/districts";
import { getDistrictProgress, isBuildingAllowedInDistrict } from "../game/systems/DistrictSystem";
import type { BuildingCategory, BuildingDefinition } from "../game/types/Building";
import type { BuildDistrictId } from "../game/types/District";
import type { MiningResourceType } from "../game/types/Mining";
import { useGameStore } from "../store/gameStore";
import { formatCoinAmount } from "../utils/coinFormatting";
import { useState } from "react";

interface BuildingSelectorProps {
  onClose: () => void;
  browseDistrictOnly?: boolean;
}

export function BuildingCost({ building }: { building: BuildingDefinition }): JSX.Element {
  return (
    <span className="building-cost">
      {building.cost > 0 && (
        <span className="building-cost-item" aria-label={`コイン ${formatCoinAmount(building.cost)}`}>
          <span className="tiny-coin" aria-hidden="true">✦</span>
          {formatCoinAmount(building.cost)}
        </span>
      )}
      {Object.entries(building.miningCost ?? {}).map(([resourceType, amount]) => {
        const resource = getMiningResourceDefinition(resourceType as MiningResourceType);
        return (
          <span
            key={resourceType}
            className="building-cost-item building-mining-cost"
            aria-label={`${resource.name} ${amount}`}
            title={`${resource.name} ${amount}`}
          >
            <span aria-hidden="true">{resource.icon}</span>
            {amount}
          </span>
        );
      })}
    </span>
  );
}

export function BuildingSelector({ onClose, browseDistrictOnly = false }: BuildingSelectorProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>("building");
  const game = useGameStore((store) => store.game);
  const selectedBuildingId = useGameStore((store) => store.selectedBuildingId);
  const selectedDistrictId = useGameStore((store) => store.selectedDistrictId);
  const selectDistrict = useGameStore((store) => store.selectDistrict);
  const beginBuild = useGameStore((store) => store.beginBuild);
  const [visibleDistrictId, setVisibleDistrictId] = useState<BuildDistrictId>(selectedDistrictId);

  const selectedDistrict = getDistrictDefinition(visibleDistrictId) ?? buildDistrictDefinitions[0];
  const livestockCount = game.buildings.filter((building) => isLivestockBuildingId(building.buildingId)).length;
  const livestockLimitReached = livestockCount >= MAX_LIVESTOCK_COUNT;
  const available = playerBuildingIds
    .filter((buildingId) => game.unlockedBuildings.includes(buildingId))
    .filter((buildingId) => isBuildingAllowedInDistrict(visibleDistrictId, buildingId))
    .map((buildingId) => getBuildingDefinition(buildingId))
    .filter((definition): definition is (typeof buildingDefinitions)[number] => Boolean(definition));
  const category = buildingCategoryDefinitions.find(
    (definition) => definition.id === selectedCategory,
  );
  const categorizedAvailable = available.filter(
    (building) => building.category === selectedCategory,
  );
  const districtProgress = visibleDistrictId === "common"
    ? undefined
    : getDistrictProgress(game, visibleDistrictId);

  const handleDistrictSelect = (districtId: BuildDistrictId): void => {
    setVisibleDistrictId(districtId);
    if (!browseDistrictOnly) selectDistrict(districtId);
    setSelectedCategory(districtId === "nature-park" ? "nature" : "building");
  };

  const handleBuildingSelect = (buildingId: string): void => {
    beginBuild(buildingId, visibleDistrictId);
    onClose();
  };

  return (
    <section className="building-selector" data-panel="building-selector" aria-label="建築物を選ぶ">
      <div className="building-selector-heading">
        <div>
          <strong>建築物を選ぶ</strong>
          <small>地区を選んで、建築する建物を選択してください</small>
          <span className="building-selector-summary">家畜: {livestockCount} / {MAX_LIVESTOCK_COUNT}</span>
        </div>
        <button
          className="farm-panel-close"
          type="button"
          aria-label="建築物選択を閉じる"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="district-tabs" role="tablist" aria-label="建築地区">
        {buildDistrictDefinitions.map((definition) => (
          <button
            key={definition.id}
            id={`building-district-${definition.id}`}
            type="button"
            role="tab"
            aria-controls="building-district-panel"
            aria-selected={visibleDistrictId === definition.id}
            className="district-tab"
            data-district-id={definition.id}
            onClick={() => handleDistrictSelect(definition.id)}
          >
            <span aria-hidden="true">{definition.icon}</span>
            {definition.name}
          </button>
        ))}
      </div>
      <p className="district-description">{selectedDistrict.description}</p>
      {districtProgress && (
        <div className="district-progress" aria-label={`${selectedDistrict.name}の目標`}>
          <div className="district-progress-heading">
            <strong>地区の目標</strong>
            <span>
              {districtProgress.completed
                ? "達成"
                : `${districtProgress.requirements.filter((requirement) => requirement.completed).length}/${districtProgress.requirements.length}項目`}
            </span>
          </div>
          <div className="district-progress-list">
            {districtProgress.requirements.map(({ requirement, current, completed }) => (
              <span className={completed ? "is-complete" : ""} key={requirement.label}>
                {requirement.label} {current}/{requirement.target}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="building-category-tabs" role="tablist" aria-label="建築カテゴリ">
        {buildingCategoryDefinitions.map((definition) => (
          <button
            key={definition.id}
            id={`building-category-${definition.id}`}
            type="button"
            role="tab"
            aria-controls="building-category-panel"
            aria-selected={selectedCategory === definition.id}
            className="building-category-tab"
            onClick={() => setSelectedCategory(definition.id)}
          >
            <span aria-hidden="true">{definition.icon}</span>
            {definition.name}
          </button>
        ))}
      </div>
      <div
        id="building-category-panel"
        role="tabpanel"
        aria-labelledby={`building-category-${selectedCategory}`}
        className="building-list"
      >
        {categorizedAvailable.length === 0 && (
          <p className="building-category-empty">
            {category?.name ?? "このカテゴリ"}はまだありません。
          </p>
        )}
        {categorizedAvailable.map((building) => {
          const isSelected = selectedBuildingId === building.id;
          const isDisabled = isLivestockBuildingId(building.id) && livestockLimitReached;
          return (
            <button
              key={building.id}
              type="button"
              className={`building-option building-choice-button ${isSelected ? "is-selected" : ""}`}
              data-building-id={building.id}
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => handleBuildingSelect(building.id)}
            >
              <span
                className={`building-icon building-choice-icon building-icon-${building.category} building-icon-${building.id}`}
              >
                {building.menuIcon}
              </span>
              <span className="building-option-copy building-choice-copy">
                <strong>{building.name}</strong>
                <small>{building.description}</small>
              </span>
              <span className="building-choice-end">
                <BuildingCost building={building} />
                <span className="building-choice-check" aria-hidden="true">{isSelected ? "✓" : ""}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
