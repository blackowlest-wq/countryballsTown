import { describe, expect, it } from "vitest";
import {
  CROP_GREEN_STAGE_MS,
  CROP_MATURE_STAGE_MS,
  INITIAL_RICE_SEEDS,
  INITIAL_TOMATO_SEEDS,
} from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { getCropEncyclopediaId } from "../../src/game/data/encyclopedia";
import {
  getCropGrowthStage,
  isCellInField,
  normalizeCrops,
  performCropAction,
} from "../../src/game/systems/CropSystem";

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

describe("CropSystem", () => {
  it("空の畑に小麦の種を1個使って蒔く", () => {
    const initial = createStateWithField();
    const result = performCropAction(initial, "plant", "wheat", 8, 8, 1_000);

    expect(result.outcome).toBe("planted");
    expect(result.state.crops).toEqual([
      { type: "wheat", gridX: 8, gridY: 8, plantedAt: 1_000 },
    ]);
    expect(result.state.wheatSeeds).toBe(initial.wheatSeeds - 1);
    expect(result.state.tomatoSeeds).toBe(INITIAL_TOMATO_SEEDS);
    expect(result.state.encyclopediaCollectedIds).toContain(getCropEncyclopediaId("wheat"));
  });

  it("初期5個のトマトの種から選んで蒔ける", () => {
    const initial = createStateWithField();
    expect(initial.tomatoSeeds).toBe(5);

    const result = performCropAction(initial, "plant", "tomato", 8, 8, 1_000);
    expect(result).toMatchObject({
      outcome: "planted",
      cropType: "tomato",
      state: {
        tomatoSeeds: 4,
        tomatoes: 0,
        crops: [{ type: "tomato", gridX: 8, gridY: 8, plantedAt: 1_000 }],
      },
    });
    expect(result.state.wheatSeeds).toBe(initial.wheatSeeds);
  });

  it("10秒で緑、さらに10秒で収穫可能になる", () => {
    const planted = performCropAction(
      createStateWithField(),
      "plant",
      "tomato",
      8,
      8,
      1_000,
    );
    const crop = planted.state.crops[0];

    expect(getCropGrowthStage(crop, 1_000)).toBe("seed");
    expect(getCropGrowthStage(crop, 1_000 + CROP_GREEN_STAGE_MS - 1)).toBe("seed");
    expect(getCropGrowthStage(crop, 1_000 + CROP_GREEN_STAGE_MS)).toBe("green");
    expect(getCropGrowthStage(crop, 1_000 + CROP_MATURE_STAGE_MS - 1)).toBe("green");
    expect(getCropGrowthStage(crop, 1_000 + CROP_MATURE_STAGE_MS)).toBe("mature");
  });

  it("成長中のトマトは収穫できず、成熟後にトマト1個と種2個を得る", () => {
    const planted = performCropAction(
      createStateWithField(),
      "plant",
      "tomato",
      8,
      8,
      1_000,
    );

    const growing = performCropAction(
      planted.state,
      "harvest",
      "wheat",
      8,
      8,
      1_000 + CROP_MATURE_STAGE_MS - 1,
    );
    expect(growing).toMatchObject({ outcome: "growing", cropType: "tomato" });
    expect(growing.state).toBe(planted.state);

    const harvested = performCropAction(
      planted.state,
      "harvest",
      "wheat",
      8,
      8,
      1_000 + CROP_MATURE_STAGE_MS,
    );
    expect(harvested).toMatchObject({
      outcome: "harvested",
      cropType: "tomato",
      state: { tomatoes: 1, tomatoSeeds: 6, crops: [] },
    });
    expect(harvested.state.wheat).toBe(0);
  });

  it("成熟した小麦から小麦1個と種2個を得る", () => {
    const planted = performCropAction(
      createStateWithField(),
      "plant",
      "wheat",
      8,
      8,
      1_000,
    );
    const harvested = performCropAction(
      planted.state,
      "harvest",
      "tomato",
      8,
      8,
      1_000 + CROP_MATURE_STAGE_MS,
    );

    expect(harvested).toMatchObject({
      outcome: "harvested",
      cropType: "wheat",
      state: { wheat: 1, wheatSeeds: 10, crops: [] },
    });
  });

  it("米も小麦と同じ10秒・10秒の成長周期で植えて収穫できる", () => {
    const initial = createStateWithField();
    const planted = performCropAction(initial, "plant", "rice", 8, 8, 1_000);
    expect(planted).toMatchObject({
      outcome: "planted",
      cropType: "rice",
      state: {
        riceSeeds: INITIAL_RICE_SEEDS - 1,
        crops: [{ type: "rice", gridX: 8, gridY: 8, plantedAt: 1_000 }],
      },
    });

    const crop = planted.state.crops[0];
    expect(getCropGrowthStage(crop, 1_000 + CROP_GREEN_STAGE_MS)).toBe("green");
    expect(getCropGrowthStage(crop, 1_000 + CROP_MATURE_STAGE_MS)).toBe("mature");

    const harvested = performCropAction(
      planted.state,
      "harvest",
      "wheat",
      8,
      8,
      1_000 + CROP_MATURE_STAGE_MS,
    );
    expect(harvested).toMatchObject({
      outcome: "harvested",
      cropType: "rice",
      state: { rice: 1, riceSeeds: INITIAL_RICE_SEEDS + 1, crops: [] },
    });
  });

  it("種まきでは成熟作物を収穫せず、収穫では空き畑に植えない", () => {
    const initial = createStateWithField();
    const planted = performCropAction(initial, "plant", "tomato", 8, 8, 1_000);
    const plantAgain = performCropAction(
      planted.state,
      "plant",
      "wheat",
      8,
      8,
      1_000 + CROP_MATURE_STAGE_MS,
    );
    expect(plantAgain.outcome).toBe("already-planted");
    expect(plantAgain.state).toBe(planted.state);

    const harvestEmpty = performCropAction(initial, "harvest", "tomato", 8, 8, 30_000);
    expect(harvestEmpty).toMatchObject({ outcome: "empty", state: initial });
  });

  it("畑以外のセルや村の外には蒔けない", () => {
    const initial = createStateWithField();
    expect(performCropAction(initial, "plant", "tomato", 7, 8, 1_000))
      .toMatchObject({ outcome: "not-field", state: initial });
    expect(performCropAction(initial, "plant", "tomato", -1, 8, 1_000))
      .toMatchObject({ outcome: "out-of-bounds", state: initial });
  });

  it("選択した作物の種がなければ蒔けない", () => {
    const initial = { ...createStateWithField(), tomatoSeeds: 0 };
    expect(performCropAction(initial, "plant", "tomato", 8, 8, 1_000))
      .toMatchObject({ outcome: "no-seeds", cropType: "tomato", state: initial });
  });

  it("1マスの畑だけを植え付け可能セルとして扱う", () => {
    const state = createStateWithField();
    expect(isCellInField(state.buildings, 8, 8)).toBe(true);
    expect(isCellInField(state.buildings, 8, 9)).toBe(false);
  });

  it("保存値から不正・重複した作物を除き、旧小麦には種類を補う", () => {
    expect(normalizeCrops([
      { type: "tomato", gridX: 8, gridY: 8, plantedAt: 1_000 },
      { type: "wheat", gridX: 8, gridY: 8, plantedAt: 2_000 },
      { type: "potato", gridX: 9, gridY: 8, plantedAt: 1_000 },
      { type: "wheat", gridX: 20, gridY: 8, plantedAt: 1_000 },
      null,
    ])).toEqual([{ type: "tomato", gridX: 8, gridY: 8, plantedAt: 1_000 }]);

    expect(normalizeCrops([
      { gridX: 9, gridY: 9, plantedAt: 3_000 },
    ], "wheat")).toEqual([
      { type: "wheat", gridX: 9, gridY: 9, plantedAt: 3_000 },
    ]);
  });
});
