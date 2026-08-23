import { describe, expect, it } from "vitest";
import { CAVE_FUEL_PURCHASE_COST, CAVE_MAX_DEPTH, CAVE_ROCK_BREAKING_POWER_PER_FUEL } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  createInitialCaveMiningState,
  digCave,
  getCaveUpgradeCost,
  getCaveCell,
  getDrillHardness,
  getFuelTankCapacity,
  getMiningCapacity,
  getMiningInventoryTotal,
  getTargetPosition,
  normalizeCaveMiningState,
  purchaseCaveFuel,
  upgradeCave,
} from "../../src/game/systems/CaveMiningSystem";

describe("CaveMiningSystem", () => {
  it("初期状態に燃料・硬度・燃料タンク・採掘物容量がある", () => {
    const state = createInitialGameState(0);

    expect(state.caveMining).toEqual(createInitialCaveMiningState());
    expect(state.caveMining.fuel).toBe(10);
    expect(getFuelTankCapacity(state.caveMining)).toBe(10);
    expect(getDrillHardness(state.caveMining)).toBe(1);
    expect(getMiningCapacity(state.caveMining)).toBe(10);
  });

  it("削岩5で燃料を1消費し、浅い場所の銅を採掘する", () => {
    const state = createInitialGameState(0);

    const result = digCave(state, "left");

    expect(result).toMatchObject({
      ok: true,
      outcome: "dug",
      fuelConsumed: 1,
      rockBreakingPower: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
      resourceType: "copper",
    });
    expect(result.state.caveMining).toMatchObject({
      fuel: 9,
      position: { x: 2, depth: 0 },
    });
    expect(result.state.miningInventory.copper).toBe(1);
  });

  it("掘ったセルへ戻る移動では燃料を消費しない", () => {
    const state = createInitialGameState(0);
    const dug = digCave(state, "left");

    const result = digCave(dug.state, "right");

    expect(result).toMatchObject({ ok: true, outcome: "moved", fuelConsumed: 0 });
    expect(result.state.caveMining.fuel).toBe(9);
    expect(getMiningInventoryTotal(result.state.miningInventory)).toBe(1);
  });

  it("ドリル硬度が足りない岩は燃料を使わずに止まる", () => {
    const state = createInitialGameState(0);

    const result = digCave(state, "right");

    expect(result).toMatchObject({ ok: false, outcome: "too-hard", targetHardness: 2 });
    expect(result.state).toBe(state);
    expect(state.caveMining.fuel).toBe(10);
  });

  it("より深い15層目まで掘り進められ、深部にはさらに硬い地面がある", () => {
    expect(getTargetPosition({ x: 3, depth: CAVE_MAX_DEPTH - 1 }, "down"))
      .toEqual({ x: 3, depth: CAVE_MAX_DEPTH });
    expect(getTargetPosition({ x: 3, depth: CAVE_MAX_DEPTH }, "down")).toBeNull();
    expect(getCaveCell({ x: 3, depth: 12 })).toMatchObject({ hardness: 6, resourceType: "diamond" });
  });

  it("ドリルをコインで強化すると硬い岩を掘れる", () => {
    const state = { ...createInitialGameState(0), coins: getCaveUpgradeCost(createInitialGameState(0).caveMining, "drill") };
    const upgraded = upgradeCave(state, "drill");

    expect(upgraded).toMatchObject({ ok: true, state: { coins: 0 } });
    expect(getDrillHardness(upgraded.state.caveMining)).toBe(2);
    expect(digCave(upgraded.state, "right")).toMatchObject({
      ok: true,
      resourceType: "fossil",
      rockBreakingPower: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
    });
  });

  it("燃料タンクと採掘物容量を別々に強化できる", () => {
    const base = createInitialGameState(0);
    const fuelTankCost = getCaveUpgradeCost(base.caveMining, "fuel-tank");
    const capacityCost = getCaveUpgradeCost(base.caveMining, "mining-capacity");
    const state = { ...base, coins: fuelTankCost + capacityCost };

    const tank = upgradeCave(state, "fuel-tank");
    const capacity = upgradeCave(tank.state, "mining-capacity");

    expect(getFuelTankCapacity(capacity.state.caveMining)).toBe(15);
    expect(getMiningCapacity(capacity.state.caveMining)).toBe(15);
    expect(capacity.state.caveMining.fuel).toBe(10);
    expect(capacity.state.coins).toBe(0);
  });

  it("採掘物容量がいっぱいなら新しいセルを掘れない", () => {
    const state = createInitialGameState(0);
    const fullInventory = { ...state.miningInventory, copper: getMiningCapacity(state.caveMining) };
    const fullState = { ...state, miningInventory: fullInventory };

    const result = digCave(fullState, "left");

    expect(result).toMatchObject({ ok: false, outcome: "capacity-full" });
    expect(result.state).toBe(fullState);
  });

  it("燃料が0のときだけ燃料を購入できる", () => {
    const state = {
      ...createInitialGameState(0),
      coins: CAVE_FUEL_PURCHASE_COST,
      caveMining: { ...createInitialCaveMiningState(), fuel: 0 },
    };

    const result = purchaseCaveFuel(state);

    expect(result).toMatchObject({ ok: true, state: { coins: 0 } });
    expect(result.state.caveMining.fuel).toBe(5);
    expect(purchaseCaveFuel(result.state)).toMatchObject({
      ok: false,
      reason: "fuel-not-empty",
    });
  });

  it("壊れた採掘状態を初期値へ正規化する", () => {
    const normalized = normalizeCaveMiningState({
      fuel: 999,
      fuelTankLevel: -2,
      drillLevel: "bad",
      miningCapacityLevel: 1.8,
      position: { x: 999, depth: -1 },
      excavatedCells: ["3:0", "3:0", "bad", "99:99"],
    });

    expect(normalized).toMatchObject({
      fuel: 10,
      fuelTankLevel: 0,
      drillLevel: 0,
      miningCapacityLevel: 1,
      position: { x: 3, depth: 0 },
      excavatedCells: ["3:0"],
    });
  });
});
