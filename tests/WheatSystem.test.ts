import { describe, expect, it } from "vitest";
import { WHEAT_GROWTH_MS } from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  getWheatGrowthProgress,
  interactWithWheat,
  normalizeWheatCrops,
} from "../src/game/systems/WheatSystem";

describe("WheatSystem", () => {
  it("空きセルに小麦を蒔く", () => {
    const initial = createInitialGameState(0);
    const result = interactWithWheat(initial, 8, 8, 1_000);

    expect(result.outcome).toBe("planted");
    expect(result.state.wheatCrops).toEqual([
      { gridX: 8, gridY: 8, plantedAt: 1_000 },
    ]);
    expect(result.state.wheat).toBe(0);
  });

  it("成長中は収穫できず、成熟後の収穫で小麦が増える", () => {
    const planted = interactWithWheat(createInitialGameState(0), 8, 8, 1_000);
    const crop = planted.state.wheatCrops[0];

    expect(getWheatGrowthProgress(crop, 1_000)).toBe(0);
    expect(getWheatGrowthProgress(crop, 1_000 + WHEAT_GROWTH_MS / 2)).toBe(0.5);

    const growing = interactWithWheat(
      planted.state,
      8,
      8,
      1_000 + WHEAT_GROWTH_MS - 1,
    );
    expect(growing.outcome).toBe("growing");
    expect(growing.state).toBe(planted.state);

    const harvested = interactWithWheat(
      planted.state,
      8,
      8,
      1_000 + WHEAT_GROWTH_MS,
    );
    expect(harvested.outcome).toBe("harvested");
    expect(harvested.state.wheat).toBe(1);
    expect(harvested.state.wheatCrops).toEqual([]);
  });

  it("建物のセルや村の外には蒔けない", () => {
    const initial = createInitialGameState(0);
    expect(interactWithWheat(initial, 5, 5, 1_000)).toMatchObject({
      outcome: "occupied",
      state: initial,
    });
    expect(interactWithWheat(initial, -1, 8, 1_000)).toMatchObject({
      outcome: "out-of-bounds",
      state: initial,
    });
  });

  it("保存値から不正・重複した作物を除く", () => {
    expect(normalizeWheatCrops([
      { gridX: 8, gridY: 8, plantedAt: 1_000 },
      { gridX: 8, gridY: 8, plantedAt: 2_000 },
      { gridX: 20, gridY: 8, plantedAt: 1_000 },
      { gridX: 7.5, gridY: 8, plantedAt: 1_000 },
      { gridX: 9, gridY: 8, plantedAt: Number.NaN },
      null,
    ])).toEqual([{ gridX: 8, gridY: 8, plantedAt: 1_000 }]);
  });
});
