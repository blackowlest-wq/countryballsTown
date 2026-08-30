import { useState } from "react";
import {
  buildingCategoryDefinitions,
  buildingDefinitions,
  getBuildingDefinition,
  isLivestockBuildingId,
  MAX_LIVESTOCK_COUNT,
  playerBuildingIds,
} from "../game/data/buildings";
import { buildDistrictDefinitions, getDistrictDefinition } from "../game/data/districts";
import { getDistrictProgress, isBuildingAllowedInDistrict } from "../game/systems/DistrictSystem";
import type { BuildingCategory } from "../game/types/Building";
import type { BuildDistrictId } from "../game/types/District";
import type { MiningResourceType } from "../game/types/Mining";
import { getMiningResourceDefinition } from "../game/data/mining";
import { useGameStore } from "../store/gameStore";
import { formatCoinAmount } from "../utils/coinFormatting";

export function BuildMenu(): JSX.Element | null {
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>("building");
  const isOpen = useGameStore((store) => store.isBuildMenuOpen);
  const game = useGameStore((store) => store.game);
  const selectedDistrictId = useGameStore((store) => store.selectedDistrictId);
  const setOpen = useGameStore((store) => store.setBuildMenuOpen);
  const selectDistrict = useGameStore((store) => store.selectDistrict);
  const beginBuild = useGameStore((store) => store.beginBuild);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const cancelInteraction = useGameStore((store) => store.cancelInteraction);
  if (!isOpen) return null;

  const selectedDistrict = getDistrictDefinition(selectedDistrictId) ?? buildDistrictDefinitions[0];
  const livestockCount = game.buildings.filter((building) => isLivestockBuildingId(building.buildingId)).length;
  const livestockLimitReached = livestockCount >= MAX_LIVESTOCK_COUNT;
  const available = playerBuildingIds
    .filter((buildingId) => game.unlockedBuildings.includes(buildingId))
    .filter((buildingId) => isBuildingAllowedInDistrict(selectedDistrictId, buildingId))
    .map((buildingId) => getBuildingDefinition(buildingId))
    .filter((definition): definition is (typeof buildingDefinitions)[number] => Boolean(definition));
  const category = buildingCategoryDefinitions.find(
    (definition) => definition.id === selectedCategory,
  );
  const categorizedAvailable = available.filter(
    (building) => building.category === selectedCategory,
  );
  const districtProgress = selectedDistrictId === "common"
    ? undefined
    : getDistrictProgress(game, selectedDistrictId);

  const handleDistrictSelect = (districtId: BuildDistrictId): void => {
    selectDistrict(districtId);
    setSelectedCategory(districtId === "nature-park" ? "nature" : "building");
  };

  return (
    <section className="floating-panel build-menu" aria-label="建築メニュー">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MAKE YOUR VILLAGE</p>
          <h2>建築する</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="閉じる">×</button>
      </div>
      <p className="panel-hint">地区と建築物を選んで、村の好きなセルをクリック。家畜: {livestockCount} / {MAX_LIVESTOCK_COUNT}</p>
      <div className="district-tabs" role="tablist" aria-label="建築地区">
        {buildDistrictDefinitions.map((definition) => (
          <button
            key={definition.id}
            id={`building-district-${definition.id}`}
            type="button"
            role="tab"
            aria-controls="building-district-panel"
            aria-selected={selectedDistrictId === definition.id}
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
        {categorizedAvailable.map((building) => (
          <button
            key={building.id}
            type="button"
            className={`building-option ${interactionMode === "build" ? "is-selectable" : ""}`}
            data-building-id={building.id}
            disabled={isLivestockBuildingId(building.id) && livestockLimitReached}
            onClick={() => beginBuild(building.id, selectedDistrictId)}
          >
            <span
              className={`building-icon building-icon-${building.category} building-icon-${building.id}`}
            >
              {building.menuIcon}
            </span>
            <span className="building-option-copy">
              <strong>{building.name}</strong>
              <small>{building.description}</small>
            </span>
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
          </button>
        ))}
      </div>
      {interactionMode !== "inspect" && (
        <button className="subtle-button full-button" type="button" onClick={cancelInteraction}>配置モードをやめる</button>
      )}
    </section>
  );
}
