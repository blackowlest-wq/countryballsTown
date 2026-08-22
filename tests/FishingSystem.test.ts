import { describe, expect, it } from "vitest";
import { fishDefinitions } from "../src/game/data/fish";
import {
  advanceFishingGauge,
  chooseFishDefinition,
  createFishingGaugeTarget,
  isFishingGaugeInTarget,
} from "../src/game/systems/FishGameSystem";

describe("FishGameSystem", () => {
  it("確率に応じて魚を選べる", () => {
    expect(chooseFishDefinition(fishDefinitions, 0).type).toBe("sardine");
    expect(chooseFishDefinition(fishDefinitions, 0.52).type).toBe("mackerel");
    expect(chooseFishDefinition(fishDefinitions, 0.85).type).toBe("sea-bream");
    expect(chooseFishDefinition(fishDefinitions, 0.97).type).toBe("tuna");
  });

  it("レアな魚ほど食いつき時間が短く、ゲージが速く、範囲が狭い", () => {
    const common = fishDefinitions[0];
    const legendary = fishDefinitions.at(-1);
    expect(legendary).toBeDefined();
    expect(legendary!.biteWindowMs).toBeLessThan(common.biteWindowMs);
    expect(legendary!.gaugeSpeed).toBeGreaterThan(common.gaugeSpeed);
    expect(legendary!.gaugeTargetWidth).toBeLessThan(common.gaugeTargetWidth);
  });

  it("ゲージの成功範囲を画面内に配置する", () => {
    const fish = fishDefinitions.at(-1)!;
    const target = createFishingGaugeTarget(fish, 1);
    expect(target.start).toBeCloseTo(0.9);
    expect(target.end).toBeCloseTo(1);
    expect(isFishingGaugeInTarget(0.95, target)).toBe(true);
    expect(isFishingGaugeInTarget(0.5, target)).toBe(false);
  });

  it("ゲージが端で跳ね返る", () => {
    expect(advanceFishingGauge({ position: 0.95, direction: 1 }, 100, 1))
      .toEqual({ position: 0.95, direction: -1 });
    expect(advanceFishingGauge({ position: 0.05, direction: -1 }, 100, 1))
      .toEqual({ position: 0.05, direction: 1 });
  });
});
