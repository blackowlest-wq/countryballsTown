import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  BUILDING_UPGRADE_SPEED_MULTIPLIERS,
  getBuildingUpgradeAvailability,
  getBuildingProductionInterval,
  getBuildingQueueCapacity,
  getBuildingUpgradeCost,
  getBuildingUpgradeLevel,
  getBuildingUpgradeMultiplier,
  getBuildingUpgradeServiceDuration,
  getSupportedBuildingUpgradeTypes,
  normalizeBuildingUpgrades,
  upgradeBuilding,
} from "../../src/game/systems/BuildingUpgradeSystem";
import { removeBuilding } from "../../src/game/systems/BuildingSystem";
import type { GameState } from "../../src/game/types/Village";

function stateWithUpgradeBuildings(): GameState {
  const initial = createInitialGameState(0);
  return {
    ...initial,
    buildings: [
      { id: "factory-test", buildingId: "milk-factory", gridX: 8, gridY: 8 },
      { id: "shop-test", buildingId: "pizza-shop", gridX: 12, gridY: 8 },
    ],
    miningInventory: {
      ...initial.miningInventory,
      copper: 20,
      iron: 20,
      crystal: 20,
      gold: 20,
      diamond: 20,
    },
  };
}

describe("BuildingUpgradeSystem", () => {
  it("強化可能状態を購入処理と共通のqueryで返す", () => {
    const state = stateWithUpgradeBuildings();
    expect(getBuildingUpgradeAvailability(state, "factory-test", "production-speed"))
      .toMatchObject({
        level: 0,
        nextLevel: 1,
        cost: { copper: 4 },
        canUpgrade: true,
      });

    const insufficient = {
      ...state,
      miningInventory: { ...state.miningInventory, copper: 0 },
    };
    expect(getBuildingUpgradeAvailability(insufficient, "factory-test", "production-speed"))
      .toMatchObject({
        level: 0,
        nextLevel: 1,
        cost: { copper: 4 },
        canUpgrade: false,
        reason: "not-enough-resources",
      });
    expect(getBuildingUpgradeAvailability(state, "shop-test", "production-speed"))
      .toMatchObject({ canUpgrade: false, reason: "unsupported-type" });
    expect(getBuildingUpgradeAvailability({
      ...state,
      buildingUpgrades: { "factory-test": { "production-speed": 3 } },
    }, "factory-test", "production-speed"))
      .toMatchObject({ level: 3, canUpgrade: false, reason: "max-level" });
  });

  it("建物種別ごとに強化系統を制限する", () => {
    expect(getSupportedBuildingUpgradeTypes("milk-factory")).toEqual(["production-speed"]);
    expect(getSupportedBuildingUpgradeTypes("pizza-shop")).toEqual([
      "sale-speed",
      "queue-capacity",
    ]);
    expect(getSupportedBuildingUpgradeTypes("field")).toEqual([]);
  });

  it("建物インスタンスごとに鉱物を原子的に消費して強化する", () => {
    let state = stateWithUpgradeBuildings();
    const first = upgradeBuilding(state, "factory-test", "production-speed");
    expect(first).toMatchObject({ success: true, level: 1, cost: { copper: 4 } });
    expect(first.state.miningInventory).toMatchObject({ copper: 16 });
    expect(first.state.buildingUpgrades).toEqual({
      "factory-test": { "production-speed": 1 },
    });

    state = first.state;
    const second = upgradeBuilding(state, "factory-test", "production-speed");
    expect(second).toMatchObject({ success: true, level: 2, cost: { iron: 3, crystal: 2 } });
    expect(second.state.miningInventory).toMatchObject({ iron: 17, crystal: 18 });

    const insufficient = upgradeBuilding(
      { ...second.state, miningInventory: { ...second.state.miningInventory, gold: 2, diamond: 0 } },
      "factory-test",
      "production-speed",
    );
    expect(insufficient).toMatchObject({ success: false, reason: "not-enough-resources" });
    expect(insufficient.state.miningInventory.gold).toBe(2);
    expect(insufficient.state.miningInventory.diamond).toBe(0);
    expect(getBuildingUpgradeLevel(insufficient.state, "factory-test", "production-speed"))
      .toBe(2);
  });

  it("店舗の販売速度と行列上限を別々に強化する", () => {
    let state = stateWithUpgradeBuildings();
    state = upgradeBuilding(state, "shop-test", "sale-speed").state;
    state = upgradeBuilding(state, "shop-test", "queue-capacity").state;
    expect(state.buildingUpgrades["shop-test"]).toEqual({
      "sale-speed": 1,
      "queue-capacity": 1,
    });
    expect(getBuildingUpgradeMultiplier(state, "shop-test", "sale-speed"))
      .toBe(BUILDING_UPGRADE_SPEED_MULTIPLIERS[1]);
    expect(getBuildingQueueCapacity(state, "shop-test")).toBe(4);
    expect(getBuildingUpgradeServiceDuration(state, "shop-test", 4_800)).toBe(4_080);
    expect(getBuildingProductionInterval(state, "factory-test", 20_000)).toBe(20_000);

    expect(upgradeBuilding(state, "shop-test", "production-speed")).toMatchObject({
      success: false,
      reason: "unsupported-type",
    });
    expect(upgradeBuilding(state, "factory-test", "queue-capacity")).toMatchObject({
      success: false,
      reason: "unsupported-type",
    });
  });

  it("レベル別コストと倍率を3段階で固定する", () => {
    expect(getBuildingUpgradeCost("sale-speed", 1)).toEqual({ copper: 4 });
    expect(getBuildingUpgradeCost("sale-speed", 2)).toEqual({ iron: 3, crystal: 2 });
    expect(getBuildingUpgradeCost("sale-speed", 3)).toEqual({ gold: 2, diamond: 1 });
    expect(BUILDING_UPGRADE_SPEED_MULTIPLIERS).toEqual([1, 0.85, 0.7, 0.55]);
  });

  it("保存境界用の正規化で孤児・不正系統・範囲外レベルを除く", () => {
    const state = stateWithUpgradeBuildings();
    expect(normalizeBuildingUpgrades({
      "factory-test": {
        "production-speed": 9,
        "sale-speed": 2,
      },
      "shop-test": {
        "sale-speed": 1.9,
        "queue-capacity": -2,
        "production-speed": 2,
      },
      orphan: { "production-speed": 3 },
      "field-test": { "sale-speed": 3 },
    }, state.buildings)).toEqual({
      "factory-test": { "production-speed": 3 },
      "shop-test": { "sale-speed": 1 },
    });
  });

  it("建物撤去時にインスタンスの強化情報も除去する", () => {
    const upgraded = upgradeBuilding(stateWithUpgradeBuildings(), "shop-test", "sale-speed");
    const removed = removeBuilding(upgraded.state, "shop-test");
    expect(removed.success).toBe(true);
    expect(removed.state.buildingUpgrades).toEqual({});
  });

  it("最大レベルでは追加消費せず失敗する", () => {
    const base = stateWithUpgradeBuildings();
    const maxed = {
      ...base,
      buildingUpgrades: { "factory-test": { "production-speed": 3 } },
    };
    const result = upgradeBuilding(maxed, "factory-test", "production-speed");
    expect(result).toMatchObject({ success: false, reason: "max-level" });
    expect(result.state).toBe(maxed);
  });
});
