import { describe, expect, it } from "vitest";
import {
  CAVE_FUEL_PURCHASE_COST,
  CAVE_MAX_DEPTH,
  CAVE_MAX_DRILL_HARDNESS,
  CAVE_MAX_DRILL_LEVEL,
  CAVE_ROCK_BREAKING_POWER_PER_FUEL,
} from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { getMiningResourceDefinition } from "../../src/game/data/mining";
import {
  createInitialCaveMiningState,
  getCaveCellDamage,
  getCaveDigDamage,
  digCave,
  getCaveUpgradeCost,
  getCaveCell,
  getDrillHardness,
  getFuelTankCapacity,
  getMiningCapacity,
  getMiningInventoryTotal,
  getRevealedCaveResourceType,
  getTargetPosition,
  isCaveUpgradeMaxed,
  isCaveCellCracked,
  isCaveResourceRevealed,
  normalizeCaveMiningState,
  purchaseCaveFuel,
  resetCaveMining,
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

  it("削岩5を上限にダメージを蓄積し、半分を超えるとヒビが入る", () => {
    const state = createInitialGameState(0);

    const first = digCave(state, "left");

    expect(first).toMatchObject({
      ok: true,
      outcome: "damaged",
      fuelConsumed: 1,
      rockBreakingPower: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
      damageDealt: 5,
      cellDamage: 5,
      cellDurability: 11,
      isCracked: false,
    });
    expect(first.state.caveMining).toMatchObject({ fuel: 9, position: { x: 3, depth: 0 } });

    const second = digCave(first.state, "left");
    expect(second).toMatchObject({ outcome: "damaged", fuelConsumed: 1, cellDamage: 10, isCracked: true });
    expect(getCaveCellDamage(second.state.caveMining, { x: 2, depth: 0 })).toBe(10);
    expect(isCaveCellCracked(second.state.caveMining, { x: 2, depth: 0 })).toBe(true);

    const dug = digCave(second.state, "left");
    expect(dug).toMatchObject({ outcome: "dug", resourceType: "copper", damageDealt: 5, cellDamage: 0 });
    expect(dug.state.caveMining).toMatchObject({ fuel: 7, position: { x: 2, depth: 0 } });
    expect(dug.state.miningInventory.copper).toBe(1);
    expect(dug.state.caveMining.cellDamage).toEqual({});
  });

  it("掘ったセルへ戻る移動では燃料を消費しない", () => {
    const state = createInitialGameState(0);
    const first = digCave(state, "left");
    const second = digCave(first.state, "left");
    const dug = digCave(second.state, "left");

    const result = digCave(dug.state, "right");

    expect(result).toMatchObject({ ok: true, outcome: "moved", fuelConsumed: 0 });
    expect(result.state.caveMining.fuel).toBe(7);
    expect(getMiningInventoryTotal(result.state.miningInventory)).toBe(1);
  });

  it("ドリル硬度が足りなくても掘れるが、削岩効率が下がる", () => {
    const state = createInitialGameState(0);

    const result = digCave(state, "right");

    expect(result).toMatchObject({
      ok: true,
      outcome: "damaged",
      targetHardness: 2,
      damageDealt: 2,
      fuelConsumed: 1,
      cellDamage: 2,
    });
    expect(result.state).not.toBe(state);
    expect(result.state.caveMining.fuel).toBe(9);
  });

  it("上下に移動対象を取り、深部ほど耐久値が大きい", () => {
    expect(getTargetPosition({ x: 3, depth: 1 }, "up"))
      .toEqual({ x: 3, depth: 0 });
    expect(getTargetPosition({ x: 3, depth: 0 }, "up")).toBeNull();
    expect(getTargetPosition({ x: 3, depth: CAVE_MAX_DEPTH - 1 }, "down"))
      .toEqual({ x: 3, depth: CAVE_MAX_DEPTH });
    expect(getTargetPosition({ x: 3, depth: CAVE_MAX_DEPTH }, "down")).toBeNull();
    expect(getCaveCell({ x: 3, depth: 12 })).toMatchObject({ hardness: 6, resourceType: "diamond" });
    expect(getCaveCell({ x: 3, depth: 15 })!.durability)
      .toBeGreaterThan(getCaveCell({ x: 3, depth: 0 })!.durability);
    expect(getCaveDigDamage(1, 2)).toBe(2);
    expect(getCaveDigDamage(2, 2)).toBe(CAVE_ROCK_BREAKING_POWER_PER_FUEL);
    expect(getCaveDigDamage(1, 6)).toBe(1);
  });

  it("鉱物の硬度は銅・鉄・金・ダイヤモンドの順に上がる", () => {
    const hardnesses = ["copper", "iron", "gold", "diamond"]
      .map((resourceType) => getMiningResourceDefinition(resourceType as "copper" | "iron" | "gold" | "diamond").hardness);

    expect(hardnesses).toEqual([1, 2, 3, 4]);
    expect(hardnesses[0]).toBeLessThan(hardnesses[1]);
    expect(hardnesses[1]).toBeLessThan(hardnesses[2]);
    expect(hardnesses[2]).toBeLessThan(hardnesses[3]);
  });

  it("ドリルをコインで強化すると硬い岩を掘れる", () => {
    const state = { ...createInitialGameState(0), coins: getCaveUpgradeCost(createInitialGameState(0).caveMining, "drill") };
    const upgraded = upgradeCave(state, "drill");

    expect(upgraded).toMatchObject({ ok: true, state: { coins: 0 } });
    expect(getDrillHardness(upgraded.state.caveMining)).toBe(2);
    expect(digCave(upgraded.state, "right")).toMatchObject({
      ok: true,
      outcome: "damaged",
      damageDealt: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
      rockBreakingPower: CAVE_ROCK_BREAKING_POWER_PER_FUEL,
    });
  });

  it("ドリル硬度は10を上限にし、最大後は強化できない", () => {
    const base = createInitialGameState(0);
    const maxState = {
      ...base,
      coins: getCaveUpgradeCost(
        { ...base.caveMining, drillLevel: CAVE_MAX_DRILL_LEVEL },
        "drill",
      ),
      caveMining: { ...base.caveMining, drillLevel: CAVE_MAX_DRILL_LEVEL },
    };

    expect(getDrillHardness(maxState.caveMining)).toBe(CAVE_MAX_DRILL_HARDNESS);
    expect(isCaveUpgradeMaxed(maxState.caveMining, "drill")).toBe(true);
    expect(upgradeCave(maxState, "drill")).toMatchObject({
      ok: false,
      state: maxState,
      reason: "max-level",
    });
  });

  it("採掘済みパネルから1マス以内の埋蔵物を表示する", () => {
    const state = createInitialGameState(0).caveMining;

    expect(isCaveResourceRevealed(state, { x: 2, depth: 0 })).toBe(true);
    expect(getRevealedCaveResourceType(state, { x: 2, depth: 0 })).toBe("copper");
    expect(isCaveResourceRevealed(state, { x: 1, depth: 2 })).toBe(false);
    expect(getRevealedCaveResourceType(state, { x: 1, depth: 2 })).toBeNull();

    const movedState = {
      ...state,
      excavatedCells: [...state.excavatedCells, "3:1"],
    };
    expect(getRevealedCaveResourceType(movedState, { x: 3, depth: 2 })).toBe("gold");
  });

  it("採掘リセットで地形Seedと掘削状態だけを更新し、強化と材料を保持する", () => {
    const base = createInitialGameState(0);
    const state = {
      ...base,
      coins: 321,
      miningInventory: { ...base.miningInventory, copper: 2 },
      caveMining: {
        ...base.caveMining,
        drillLevel: 2,
        fuelTankLevel: 1,
        fuel: 3,
        position: { x: 2, depth: 0 },
        excavatedCells: ["3:0", "2:0"],
        cellDamage: { "4:0": 4 },
      },
    };

    const reset = resetCaveMining(state, () => 0.25);

    expect(reset.coins).toBe(321);
    expect(reset.miningInventory.copper).toBe(2);
    expect(reset.caveMining).toMatchObject({
      drillLevel: 2,
      fuelTankLevel: 1,
      fuel: 3,
      position: { x: 3, depth: 0 },
      excavatedCells: ["3:0"],
      cellDamage: {},
    });
    expect(reset.caveMining.layoutSeed).not.toBe(base.caveMining.layoutSeed);
    expect(getCaveCell({ x: 2, depth: 0 }, reset.caveMining.layoutSeed)?.resourceType).not.toBeNull();
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

  it("燃料が0のときだけ、燃料タンクを満タンまで補給できる", () => {
    const state = {
      ...createInitialGameState(0),
      coins: CAVE_FUEL_PURCHASE_COST,
      caveMining: { ...createInitialCaveMiningState(), fuel: 0, fuelTankLevel: 1 },
    };

    const result = purchaseCaveFuel(state);

    expect(result).toMatchObject({ ok: true, state: { coins: 0 } });
    expect(result.state.caveMining.fuel).toBe(15);
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
      cellDamage: { "2:0": 5, "3:0": 99, bad: 2 },
    });

    expect(normalized).toMatchObject({
      fuel: 10,
      fuelTankLevel: 0,
      drillLevel: 0,
      miningCapacityLevel: 1,
      position: { x: 3, depth: 0 },
      excavatedCells: ["3:0"],
      cellDamage: { "2:0": 5 },
    });
  });
});
