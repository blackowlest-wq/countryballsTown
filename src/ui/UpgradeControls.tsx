import {
  getBuildingUpgradeAvailability,
  getBuildingUpgradeMultiplier,
  getBuildingUpgradeQueueCapacity,
} from "../game/systems/BuildingUpgradeSystem";
import type { BuildingUpgradeType } from "../game/types/BuildingUpgrade";
import type { MiningResourceType } from "../game/types/Mining";
import { getMiningResourceDefinition } from "../game/data/mining";
import { useGameStore } from "../store/gameStore";

interface UpgradeControlsProps {
  buildingId: string | null;
  upgradeTypes: readonly BuildingUpgradeType[];
}

const UPGRADE_LABELS: Record<BuildingUpgradeType, string> = {
  "production-speed": "生産速度",
  "sale-speed": "販売速度",
  "queue-capacity": "行列上限",
};

function formatCost(cost: Partial<Record<MiningResourceType, number>>): string {
  return Object.entries(cost).map(([resourceType, amount]) => {
    const definition = getMiningResourceDefinition(resourceType as MiningResourceType);
    return `${definition.icon}${amount}`;
  }).join(" ");
}

function formatEffect(
  game: ReturnType<typeof useGameStore.getState>["game"],
  buildingId: string,
  upgradeType: BuildingUpgradeType,
): string {
  if (upgradeType === "queue-capacity") {
    return `現在 ${getBuildingUpgradeQueueCapacity(game, buildingId)}人`;
  }
  const multiplier = getBuildingUpgradeMultiplier(game, buildingId, upgradeType);
  const percent = Math.round((1 - multiplier) * 100);
  return `現在 ${percent > 0 ? `${percent}%短縮` : "標準"}`;
}

export function UpgradeControls({ buildingId, upgradeTypes }: UpgradeControlsProps): JSX.Element | null {
  const game = useGameStore((store) => store.game);
  const upgrade = useGameStore((store) => store.upgradeBuilding);
  if (!buildingId || upgradeTypes.length === 0) return null;

  return (
    <section className="building-upgrade-section" aria-label="建物の強化">
      <div className="building-upgrade-heading">
        <strong>建物を強化</strong>
        <small>採掘素材を使います</small>
      </div>
      <div className="building-upgrade-list">
        {upgradeTypes.map((upgradeType) => {
          const availability = getBuildingUpgradeAvailability(game, buildingId, upgradeType);
          const { level, nextLevel, cost } = availability;
          const maxed = availability.reason === "max-level";
          const effect = formatEffect(game, buildingId, upgradeType);
          return (
            <button
              key={upgradeType}
              className="building-upgrade-control"
              type="button"
              disabled={!availability.canUpgrade}
              data-upgrade-type={upgradeType}
              onClick={() => upgrade(buildingId, upgradeType)}
              title={maxed ? "最大レベル" : availability.reason === "not-enough-resources" ? "採掘素材が足りません" : undefined}
            >
              <span className="building-upgrade-copy">
                <strong>{UPGRADE_LABELS[upgradeType]} Lv.{level}</strong>
                <small>{effect}</small>
                <small>{maxed ? "最大レベル" : `次の効果：Lv.${nextLevel}`}</small>
              </span>
              <span className="building-upgrade-cost">
                {maxed ? "MAX" : formatCost(cost ?? {})}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
