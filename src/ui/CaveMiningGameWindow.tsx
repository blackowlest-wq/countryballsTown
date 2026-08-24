import { useEffect, useRef, useState } from "react";
import {
  CAVE_MAX_DEPTH,
  CAVE_VISIBLE_MAP_ROWS,
  CAVE_WIDTH,
  CAVE_ROCK_BREAKING_POWER_PER_FUEL,
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
  getRevealedCaveResourceType,
  getTargetPosition,
  isCaveCellCracked,
  isCaveCellExcavated,
  isCaveUpgradeMaxed,
  type CaveUpgradeKind,
} from "../game/systems/CaveMiningSystem";
import type { DigDirection } from "../game/types/Mining";
import { useGameStore } from "../store/gameStore";
import { CaveDrillIcon } from "./CaveDrillIcon";

const directions: ReadonlyArray<{ direction: DigDirection; label: string; icon: string }> = [
  { direction: "left", label: "左へ掘る", icon: "←" },
  { direction: "up", label: "上へ掘る", icon: "↑" },
  { direction: "down", label: "下へ掘る", icon: "↓" },
  { direction: "right", label: "右へ掘る", icon: "→" },
];

function getVisibleDepths(currentDepth: number): number[] {
  const rowCount = Math.min(CAVE_VISIBLE_MAP_ROWS, CAVE_MAX_DEPTH + 1);
  const maxStart = CAVE_MAX_DEPTH - rowCount + 1;
  const startDepth = Math.min(
    maxStart,
    Math.max(0, currentDepth - Math.floor(rowCount / 2)),
  );
  return Array.from({ length: rowCount }, (_, index) => startDepth + index);
}

const upgrades: ReadonlyArray<{
  kind: CaveUpgradeKind;
  label: string;
  description: string;
}> = [
  { kind: "drill", label: "ドリル硬度", description: "硬い岩を効率よく掘る" },
  { kind: "fuel-tank", label: "燃料タンク", description: "最大燃料が増える" },
  { kind: "mining-capacity", label: "バッグ容量", description: "持てる採掘物が増える" },
];

function getCellLabel(
  x: number,
  depth: number,
  isExcavated: boolean,
  isCurrent: boolean,
  resourceName?: string,
  isCracked = false,
): string {
  if (isCurrent) return resourceName
    ? `現在地 深さ${depth} ${resourceName}を採掘済み`
    : `現在地 深さ${depth}`;
  if (isExcavated && resourceName) return `${resourceName}を採掘済み 深さ${depth}`;
  if (resourceName && isCracked) return `${resourceName}が埋まっている岩盤 深さ${depth} ヒビあり`;
  if (resourceName) return `${resourceName}が埋まっている岩盤 深さ${depth}`;
  if (isExcavated) return `掘削済み x${x} 深さ${depth}`;
  if (isCracked) return `ヒビの入った岩盤 x${x} 深さ${depth}`;
  return `岩盤 x${x} 深さ${depth}`;
}

export function CaveMiningGameWindow(): JSX.Element | null {
  const open = useGameStore((store) => store.isCaveMiningGameOpen);
  const game = useGameStore((store) => store.game);
  const close = useGameStore((store) => store.closeCaveMiningGame);
  const digCave = useGameStore((store) => store.digCave);
  const resetCaveMining = useGameStore((store) => store.resetCaveMining);
  const purchaseFuel = useGameStore((store) => store.purchaseCaveFuel);
  const upgradeCave = useGameStore((store) => store.upgradeCave);
  const notice = useGameStore((store) => store.notice);
  const [isDigging, setIsDigging] = useState(false);
  const digTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (digTimerRef.current !== null) window.clearTimeout(digTimerRef.current);
  }, []);

  if (!open) return null;

  const mining = game.caveMining;
  const fuelCapacity = getFuelTankCapacity(mining);
  const drillHardness = getDrillHardness(mining);
  const miningCapacity = getMiningCapacity(mining);
  const miningTotal = getMiningInventoryTotal(mining.carriedInventory);
  const currentCell = getCaveCell(mining.position, mining.layoutSeed);
  const visibleDepths = getVisibleDepths(mining.position.depth);
  const displayNotice = notice ?? "上下左右のボタンで地面を掘り進めます。";

  const handleDig = (direction: DigDirection): void => {
    if (isDigging) return;
    const outcome = digCave(direction);
    if (outcome !== "damaged" && outcome !== "dug") return;
    setIsDigging(true);
    digTimerRef.current = window.setTimeout(() => {
      digTimerRef.current = null;
      setIsDigging(false);
    }, 520);
  };

  return (
    <div className="cave-mining-overlay">
      <section className={`cave-mining-window ${isDigging ? "is-digging" : ""}`} role="dialog" aria-modal="true" aria-label="地面採掘ゲーム">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">GROUND MINING GAME</p>
            <h2>地面採掘ゲーム</h2>
          </div>
          <div className="cave-mining-window-actions">
            <button
              type="button"
              className="secondary-button cave-reset-button"
              data-action="reset-cave"
              onClick={resetCaveMining}
              disabled={isDigging}
            >
              採掘リセット
            </button>
            <button className="icon-button" type="button" onClick={close} aria-label="地面採掘ゲームを閉じる">×</button>
          </div>
        </div>
        <p className="panel-hint">上下左右へ掘り進み、見つけた採掘物をバッグに入れます。ゲーム終了時に材料へ蓄積され、バッグは空になります。</p>
        <p className="cave-mining-notice" role="status">{displayNotice}</p>

        <div className="cave-mining-stats" aria-label="採掘ステータス">
          <div className="cave-mining-stat fuel-stat">
            <span>燃料</span>
            <strong>⛽ {mining.fuel} / {fuelCapacity}</strong>
          </div>
          <div className="cave-mining-stat">
            <span>ドリル硬度</span>
            <strong><CaveDrillIcon /> {drillHardness}</strong>
          </div>
          <div className="cave-mining-stat">
            <span>採掘バッグ</span>
            <strong>🎒 {miningTotal} / {miningCapacity}</strong>
          </div>
        </div>

        {mining.fuel === 0 ? (
          <div className="cave-fuel-purchase">
            <div>
              <strong>燃料切れ</strong>
              <small>燃料を満タンまで🪙{CAVE_FUEL_PURCHASE_COST}で補給できます。</small>
            </div>
            <button
              type="button"
              className="primary-button"
              disabled={isDigging || game.coins < CAVE_FUEL_PURCHASE_COST}
              onClick={purchaseFuel}
            >
              燃料を購入
            </button>
          </div>
        ) : (
          <p className="cave-mining-footnote cave-mining-fuel-hint">燃料は削岩5ごとに1消費します。燃料が0になると満タンまで補給できます。</p>
        )}

        <div className="cave-mining-board" aria-label="採掘盤面">
          <div className="cave-mining-board-depths" aria-hidden="true">
            {visibleDepths.map((depth) => (
              <span key={depth}>{depth}</span>
            ))}
          </div>
          <div className="cave-mining-grid">
            {visibleDepths.map((depth) => (
              Array.from({ length: CAVE_WIDTH }, (_, x) => {
                const position = { x, depth };
                const isExcavated = isCaveCellExcavated(mining, position);
                const isCurrent = mining.position.x === x && mining.position.depth === depth;
                const visibleResourceType = getRevealedCaveResourceType(mining, position);
                const resourceDefinition = visibleResourceType
                  ? getMiningResourceDefinition(visibleResourceType)
                  : undefined;
                const resourceName = resourceDefinition?.name;
                const isCracked = isCaveCellCracked(mining, position);
                return (
                  <span
                    key={getCaveCellKey(position)}
                    className={`cave-mining-cell ${isExcavated ? "is-excavated" : "is-rock"} ${isCurrent ? "is-current" : ""} ${isCracked ? "is-cracked" : ""} ${resourceDefinition && !isExcavated ? "is-resource-revealed" : ""}`}
                    aria-label={getCellLabel(x, depth, isExcavated, isCurrent, resourceName, isCracked)}
                    title={resourceName ? `${resourceName}${isExcavated ? "（採掘済み）" : "（埋蔵）"}` : undefined}
                  >
                    {isCurrent
                      ? <CaveDrillIcon />
                      : isExcavated
                        ? (resourceDefinition ? resourceDefinition.icon : "·")
                        : resourceDefinition
                          ? <span className="cave-cell-buried-resource">
                            <span aria-hidden="true">{resourceDefinition.icon}</span>
                            <small>{resourceDefinition.name}</small>
                          </span>
                          : "🪨"}
                    {isCracked && <span className="cave-cell-crack" aria-hidden="true" />}
                  </span>
                );
              })
            ))}
          </div>
        </div>

        <div className="cave-mining-current" aria-label="現在の採掘位置">
          <span>深さ {mining.position.depth}</span>
          <span>現在地の地面の硬度 {currentCell?.hardness ?? "-"}</span>
          <span>削岩最大 {CAVE_ROCK_BREAKING_POWER_PER_FUEL} / 燃料1</span>
          <span>硬い地面ほど削岩効率が下がります</span>
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
                disabled={!target || isDigging}
                onClick={() => handleDig(direction)}
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
              const isMaxed = isCaveUpgradeMaxed(mining, kind);
              return (
                <button
                  key={kind}
                  type="button"
                  className="cave-upgrade-button"
                  data-upgrade={kind}
                  disabled={isDigging || isMaxed || game.coins < cost}
                  onClick={() => upgradeCave(kind)}
                >
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <b>{isMaxed ? "最大" : `🪙 ${cost}`}</b>
                </button>
              );
            })}
          </div>
        </div>

        <div className="cave-mining-inventory" aria-label="採掘材料一覧">
          <div className="cave-mining-section-heading">
            <strong>採掘材料</strong>
            <small>ゲーム終了後も蓄積し、鉱物は図鑑に登録されます</small>
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
