import { describe, expect, it } from "vitest";
import { fishDefinitions } from "../../src/game/data/fish";
import { createInitialGameState } from "../../src/game/core/GameState";
import { FISHING_ROD_COST } from "../../src/game/constants/gameConstants";
import {
  canPurchaseFishingRod,
  canStartFishing,
  purchaseFishingRod,
} from "../../src/game/systems/FishingSystem";
import {
  advanceFishingChase,
  advanceFishingFish,
  chooseFishDefinition,
  createFishingChaseState,
  isFishingFishInFrame,
  moveFishingFrameToTap,
} from "../../src/game/systems/FishGameSystem";

describe("FishGameSystem", () => {
  it("確率に応じて魚を選べる", () => {
    expect(chooseFishDefinition(fishDefinitions, 0).type).toBe("sardine");
    expect(chooseFishDefinition(fishDefinitions, 0.52).type).toBe("mackerel");
    expect(chooseFishDefinition(fishDefinitions, 0.85).type).toBe("sea-bream");
    expect(chooseFishDefinition(fishDefinitions, 0.97).type).toBe("tuna");
  });

  it("魚のサイズは一定で、レアな魚ほど速く動き捕獲に時間がかかる", () => {
    const common = fishDefinitions[0];
    const legendary = fishDefinitions.at(-1);
    expect(legendary).toBeDefined();
    expect(legendary!.biteWindowMs).toBeLessThan(common.biteWindowMs);
    expect(legendary!.movementSpeed).toBeGreaterThan(common.movementSpeed);
    expect(legendary!.movementChangeIntervalMs).toBeLessThan(common.movementChangeIntervalMs);
    expect(legendary!.catchDurationMs).toBeGreaterThan(common.catchDurationMs);
    expect(legendary!.timeLimitMs).toBeLessThan(common.timeLimitMs);
    expect(fishDefinitions.every((fish) => fish.fishSize === common.fishSize)).toBe(true);
  });

  it("魚と枠をプレイエリア内に配置し、タップ位置を枠の中心へ変換する", () => {
    const fish = fishDefinitions.at(-1)!;
    const chase = createFishingChaseState(fish, 1, 0, 0);
    expect(chase.fish.position).toEqual({
      x: 1 - fish.fishSize / 2,
      y: fish.fishSize / 2,
    });
    expect(chase.frame).toEqual({ x: 0.5, y: 0.5 });

    expect(moveFishingFrameToTap(chase.frame, { x: 1, y: -1 }, fish.catchFrameSize)).toEqual({
      x: 1 - fish.catchFrameSize / 2,
      y: fish.catchFrameSize / 2,
    });
  });

  it("魚がプレイエリアの端で跳ね返る", () => {
    const bounced = advanceFishingFish({
      position: { x: 0.92, y: 0.5 },
      velocity: { x: 0.4, y: 0 },
    }, 100, 0.1);
    expect(bounced.position.x).toBeCloseTo(0.94);
    expect(bounced.position.y).toBe(0.5);
    expect(bounced.velocity).toEqual({ x: -0.4, y: 0 });
  });

  it("一定時間ごとに魚の向きと速度を乱数で変える", () => {
    const fish = fishDefinitions[0];
    const chase = {
      fish: {
        position: { x: 0.5, y: 0.5 },
        velocity: { x: fish.movementSpeed, y: 0 },
        directionChangeInMs: 100,
      },
      frame: { x: 0.5, y: 0.5 },
      focusProgressMs: 0,
      remainingTimeMs: fish.timeLimitMs,
    };
    const randomValues = [0.25, 0, 0.5];
    const updated = advanceFishingChase(
      chase,
      fish,
      100,
      () => randomValues.shift() ?? 0,
    );

    expect(updated.state.fish.velocity.x).toBeCloseTo(0);
    expect(updated.state.fish.velocity.y).toBeGreaterThan(0);
    expect(updated.state.fish.directionChangeInMs).toBeCloseTo(fish.movementChangeIntervalMs);
  });

  it("魚が枠に入っている間だけ捕獲ゲージが増え、必要時間で釣り上がる", () => {
    const fish = fishDefinitions[0];
    const chase = {
      fish: {
        position: { x: 0.5, y: 0.5 },
        velocity: { x: 0, y: 0 },
        directionChangeInMs: 10_000,
      },
      frame: { x: 0.5, y: 0.5 },
      focusProgressMs: 0,
      remainingTimeMs: fish.timeLimitMs,
    };

    const focused = advanceFishingChase(chase, fish, 1_000);
    expect(focused.isFishInFrame).toBe(true);
    expect(focused.state.focusProgressMs).toBe(1_000);
    expect(focused.caught).toBe(false);

    const caught = advanceFishingChase(focused.state, fish, fish.catchDurationMs);
    expect(caught.caught).toBe(true);
    expect(caught.state.focusProgressMs).toBe(fish.catchDurationMs);

    const movedAway = advanceFishingChase({
      ...focused.state,
      frame: { x: 0.1, y: 0.1 },
    }, fish, 100);
    expect(isFishingFishInFrame(movedAway.state.fish.position, { x: 0.1, y: 0.1 }, fish.catchFrameSize, fish.fishSize)).toBe(false);
    expect(movedAway.state.focusProgressMs).toBeLessThan(focused.state.focusProgressMs);
  });

  it("制限時間が0になると、捕獲できていない釣りをタイムアウトにする", () => {
    const fish = fishDefinitions[0];
    const result = advanceFishingChase({
      fish: {
        position: { x: 0.5, y: 0.5 },
        velocity: { x: 0, y: 0 },
        directionChangeInMs: 10_000,
      },
      frame: { x: 0.1, y: 0.1 },
      focusProgressMs: 0,
      remainingTimeMs: 1_000,
    }, fish, 1_000);

    expect(result).toMatchObject({
      caught: false,
      timedOut: true,
      state: { remainingTimeMs: 0 },
    });
  });
});

describe("FishingSystem", () => {
  it("初期状態では釣り竿がなく、釣りを始められない", () => {
    const state = createInitialGameState(0);

    expect(state.hasFishingRod).toBe(false);
    expect(canStartFishing(state)).toBe(false);
    expect(canPurchaseFishingRod(state)).toBe(false);
  });

  it("1000コインで釣り竿を購入し、釣りを始められる", () => {
    const state = { ...createInitialGameState(0), coins: FISHING_ROD_COST };

    const result = purchaseFishingRod(state);

    expect(result).toMatchObject({ ok: true });
    expect(result.state).toMatchObject({
      coins: 0,
      hasFishingRod: true,
    });
    expect(canStartFishing(result.state)).toBe(true);
  });

  it("コイン不足や二重購入では状態を変えない", () => {
    const poorState = { ...createInitialGameState(0), coins: FISHING_ROD_COST - 1 };
    const poorResult = purchaseFishingRod(poorState);
    const ownedState = { ...createInitialGameState(0), hasFishingRod: true, coins: FISHING_ROD_COST };
    const ownedResult = purchaseFishingRod(ownedState);

    expect(poorResult).toMatchObject({ ok: false, reason: "not-enough-coins", state: poorState });
    expect(ownedResult).toMatchObject({ ok: false, reason: "already-owned", state: ownedState });
  });
});
