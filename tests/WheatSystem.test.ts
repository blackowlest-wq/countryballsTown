import { describe, expect, it } from "vitest";
import {
  WHEAT_GREEN_STAGE_MS,
  WHEAT_MATURE_STAGE_MS,
} from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  getWheatGrowthStage,
  isCellInField,
  normalizeWheatCrops,
  performWheatAction,
} from "../src/game/systems/WheatSystem";

function createStateWithField() {
  const initial = createInitialGameState(0);
  return {
    ...initial,
    buildings: [
      ...initial.buildings,
      { id: "field-test", buildingId: "field", gridX: 8, gridY: 8 },
    ],
  };
}

describe("WheatSystem", () => {
  it("空の畑に種を1個使って小麦を蒔く", () => {
    const initial = createStateWithField();
    const result = performWheatAction(initial, "plant", 8, 8, 1_000);

    expect(result.outcome).toBe("planted");
    expect(result.state.wheatCrops).toEqual([
      { gridX: 8, gridY: 8, plantedAt: 1_000 },
    ]);
    expect(result.state.wheatSeeds).toBe(initial.wheatSeeds - 1);
    expect(result.state.wheat).toBe(0);
  });

  it("10秒で緑、さらに10秒で茶色の成熟段階になる", () => {
    const planted = performWheatAction(
      createStateWithField(),
      "plant",
      8,
      8,
      1_000,
    );
    const crop = planted.state.wheatCrops[0];

    expect(getWheatGrowthStage(crop, 1_000)).toBe("seed");
    expect(getWheatGrowthStage(crop, 1_000 + WHEAT_GREEN_STAGE_MS - 1)).toBe("seed");
    expect(getWheatGrowthStage(crop, 1_000 + WHEAT_GREEN_STAGE_MS)).toBe("green");
    expect(getWheatGrowthStage(crop, 1_000 + WHEAT_MATURE_STAGE_MS - 1)).toBe("green");
    expect(getWheatGrowthStage(crop, 1_000 + WHEAT_MATURE_STAGE_MS)).toBe("mature");
  });

  it("成長中は収穫できず、成熟後に小麦1個と種2個を得る", () => {
    const planted = performWheatAction(
      createStateWithField(),
      "plant",
      8,
      8,
      1_000,
    );

    const growing = performWheatAction(
      planted.state,
      "harvest",
      8,
      8,
      1_000 + WHEAT_MATURE_STAGE_MS - 1,
    );
    expect(growing.outcome).toBe("growing");
    expect(growing.state).toBe(planted.state);

    const harvested = performWheatAction(
      planted.state,
      "harvest",
      8,
      8,
      1_000 + WHEAT_MATURE_STAGE_MS,
    );
    expect(harvested.outcome).toBe("harvested");
    expect(harvested.state.wheat).toBe(1);
    expect(harvested.state.wheatSeeds).toBe(10);
    expect(harvested.state.wheatCrops).toEqual([]);
  });

  it("種まきでは成熟した小麦を収穫せず、収穫では空き地に植えない", () => {
    const initial = createStateWithField();
    const planted = performWheatAction(initial, "plant", 8, 8, 1_000);
    const plantAgain = performWheatAction(
      planted.state,
      "plant",
      8,
      8,
      1_000 + WHEAT_MATURE_STAGE_MS,
    );
    expect(plantAgain.outcome).toBe("already-planted");
    expect(plantAgain.state).toBe(planted.state);
    expect(plantAgain.state.wheat).toBe(0);

    const harvestEmpty = performWheatAction(initial, "harvest", 8, 8, 30_000);
    expect(harvestEmpty.outcome).toBe("empty");
    expect(harvestEmpty.state).toBe(initial);
    expect(harvestEmpty.state.wheatCrops).toEqual([]);
  });

  it("畑以外のセルや村の外には蒔けない", () => {
    const initial = createStateWithField();
    expect(performWheatAction(initial, "plant", 7, 8, 1_000)).toMatchObject({
      outcome: "not-field",
      state: initial,
    });
    expect(performWheatAction(initial, "plant", -1, 8, 1_000)).toMatchObject({
      outcome: "out-of-bounds",
      state: initial,
    });
  });

  it("種がなければ空の畑にも蒔けない", () => {
    const initial = { ...createStateWithField(), wheatSeeds: 0 };
    expect(performWheatAction(initial, "plant", 8, 8, 1_000)).toMatchObject({
      outcome: "no-seeds",
      state: initial,
    });
  });

  it("1マスの畑だけを植え付け可能セルとして扱う", () => {
    const state = createStateWithField();
    expect(isCellInField(state.buildings, 8, 8)).toBe(true);
    expect(isCellInField(state.buildings, 8, 9)).toBe(false);
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
