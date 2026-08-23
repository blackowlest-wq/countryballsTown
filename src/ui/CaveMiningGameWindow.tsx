import {
  CAVE_MAX_DEPTH,
  CAVE_WIDTH,
  CAVE_ROCK_BREAKING_POWER_PER_FUEL,
  CAVE_FUEL_PURCHASE_AMOUNT,
  CAVE_FUEL_PURCHASE_COST,
} from "../game/constants/gameConstants";
import { miningResourceDefinitions, getMiningResourceDefinition } from "../game/data/mining";
import {
  getCaveCell,
  getCaveCellKey,
  getCaveUpgradeCost,
  getDrillHardness,
  getFuelTankCapacity,
  getMiningCapacity,
  getMiningInventoryTotal,
  getTargetPosition,
  isCaveCellExcavated,
  type CaveUpgradeKind,
} from "../game/systems/CaveMiningSystem";
import type { DigDirection } from "../game/types/Mining";
import { useGameStore } from "../store/gameStore";

const directions: ReadonlyArray<{ direction: DigDirection; label: string; icon: string }> = [
  { direction: "left", label: "左へ掘る", icon: "←" },
  { direction: "down", label: "下へ掘る", icon: "↓" },
  { direction: "right", label: "右へ掘る", icon: "→" },
];

const upgrades: ReadonlyArray<{
  kind: CaveUpgradeKind;
  label: string;
  description: string;
}> = [
  { kind: "drill", label: "ドリル硬度", description: "硬い岩を掘れる" },
  { kind: "fuel-tank", label: "燃料タンク", description: "最大燃料が増える" },
  { kind: "mining-capacity", label: "採掘物容量", description: "持ち帰れる数が増える" },
];

function getCellLabel(
  x: number,
  depth: number,
  isExcavated: boolean,
  isCurrent: boolean,
  resourceName?: string,
): string {
  if (isCurrent) return `現在地 深さ${depth}`;
  if (isExcavated && resourceName) return `${resourceName}を採掘済み 深さ${depth}`;
  if (isExcavated) return `掘削済み x${x} 深さ${depth}`;
  return `岩盤 x${x} 深さ${depth}`;
}

export function CaveMiningGameWindow(): JSX.Element | null {
  const open = useGameStore((store) => store.isCaveMiningGameOpen);
  const game = useGameStore((store) => store.game);
  const close = useGameStore((store) => store.closeCaveMiningGame);
  const digCave = useGameStore((store) => store.digCave);
  const purchaseFuel = useGameStore((store) => store.purchaseCaveFuel);
  const upgradeCave = useGameStore((store) => store.upgradeCave);
  if (!open) return null;

  const mining = game.caveMining;
  const fuelCapacity = getFuelTankCapacity(mining);
  const drillHardness = getDrillHardness(mining);
  const miningCapacity = getMiningCapacity(mining);
  const miningTotal = getMiningInventoryTotal(game.miningInventory);
  const currentCell = getCaveCell(mining.position);

  return (
    <div className="cave-mining-overlay">
      <section className="cave-mining-window" role="dialog" aria-modal="true" aria-label="地面採掘ゲーム">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">GROUND MINING GAME</p>
            <h2>地面採掘ゲーム</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} aria-label="地面採掘ゲームを閉じる">×</button>
        </div>
        <p className="panel-hint">下や横へ掘り進み、見つけた採掘物を図鑑と材料に加えます。</p>

        <div className="cave-mining-stats" aria-label="採掘ステータス">
          <div className="cave-mining-stat fuel-stat">
            <span>燃料</span>
            <strong>⛽ {mining.fuel} / {fuelCapacity}</strong>
          </div>
          <div className="cave-mining-stat">
            <span>ドリル硬度</span>
            <strong>⛏ {drillHardness}</strong>
          </div>
          <div className="cave-mining-stat">
            <span>採掘物</span>
            <strong>🎒 {miningTotal} / {miningCapacity}</strong>
          </div>
        </div>

        <div className="cave-mining-board" aria-label="採掘盤面">
          <div className="cave-mining-board-depths" aria-hidden="true">
            {Array.from({ length: CAVE_MAX_DEPTH + 1 }, (_, depth) => (
              <span key={depth}>{depth}</span>
            ))}
          </div>
          <div className="cave-mining-grid">
            {Array.from({ length: CAVE_MAX_DEPTH + 1 }, (_, depth) => (
              Array.from({ length: CAVE_WIDTH }, (_, x) => {
                const position = { x, depth };
                const cell = getCaveCell(position)!;
                const isExcavated = isCaveCellExcavated(mining, position);
                const isCurrent = mining.position.x === x && mining.position.depth === depth;
                const resourceName = isExcavated && cell.resourceType
                  ? getMiningResourceDefinition(cell.resourceType).name
                  : undefined;
                return (
                  <span
                    key={getCaveCellKey(position)}
                    className={`cave-mining-cell ${isExcavated ? "is-excavated" : "is-rock"} ${isCurrent ? "is-current" : ""}`}
                    aria-label={getCellLabel(x, depth, isExcavated, isCurrent, resourceName)}
                  >
                    {isCurrent ? "⛏" : isExcavated ? (cell.resourceType ? getMiningResourceDefinition(cell.resourceType).icon : "·") : "🪨"}
                  </span>
                );
              })
            ))}
          </div>
        </div>

        <div className="cave-mining-current" aria-label="現在の採掘位置">
          <span>深さ {mining.position.depth}</span>
          <span>次の岩の硬度 {currentCell?.hardness ?? "-"}</span>
          <span>削岩 {CAVE_ROCK_BREAKING_POWER_PER_FUEL} / 燃料1</span>
        </div>

        <div className="cave-mining-actions" aria-label="掘る方向">
          {directions.map(({ direction, label, icon }) => {
            const target = getTargetPosition(mining.position, direction);
            return (
              <button
                key={direction}
                type="button"
                className="cave-dig-button"
                data-direction={direction}
                disabled={!target}
                onClick={() => digCave(direction)}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        <div className="cave-mining-upgrade-section">
          <div className="cave-mining-section-heading">
            <strong>コインで強化</strong>
            <small>強化費用は段階的に上がります</small>
          </div>
          <div className="cave-mining-upgrades">
            {upgrades.map(({ kind, label, description }) => {
              const cost = getCaveUpgradeCost(mining, kind);
              return (
                <button
                  key={kind}
                  type="button"
                  className="cave-upgrade-button"
                  data-upgrade={kind}
                  disabled={game.coins < cost}
                  onClick={() => upgradeCave(kind)}
                >
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <b>🪙 {cost}</b>
                </button>
              );
            })}
          </div>
        </div>

        {mining.fuel === 0 ? (
          <div className="cave-fuel-purchase">
            <div>
              <strong>燃料切れ</strong>
              <small>{CAVE_FUEL_PURCHASE_AMOUNT}燃料を🪙{CAVE_FUEL_PURCHASE_COST}で購入できます。</small>
            </div>
            <button
              type="button"
              className="primary-button"
              disabled={game.coins < CAVE_FUEL_PURCHASE_COST}
              onClick={purchaseFuel}
            >
              燃料を購入
            </button>
          </div>
        ) : (
          <p className="cave-mining-footnote">燃料は削岩5ごとに1消費します。燃料が0になると購入できます。</p>
        )}

        <div className="cave-mining-inventory" aria-label="採掘物一覧">
          <div className="cave-mining-section-heading">
            <strong>採掘物</strong>
            <small>入手したものは図鑑に登録されます</small>
          </div>
          <div className="cave-mining-inventory-list">
            {miningResourceDefinitions.map((resource) => (
              <span key={resource.type} aria-label={`${resource.name} ${game.miningInventory[resource.type]}`}>
                <span aria-hidden="true">{resource.icon}</span>
                {resource.name} <b>{game.miningInventory[resource.type]}</b>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
