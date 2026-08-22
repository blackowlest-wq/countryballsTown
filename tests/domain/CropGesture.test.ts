import { describe, expect, it } from "vitest";
import { shouldStartCropGesture } from "../../src/scene/crops/cropGesture";

const fieldBuildings = [
  { id: "field-test", buildingId: "field", gridX: 8, gridY: 8 },
] as const;

describe("crop gesture capture", () => {
  it("作物モードでは畑のセルだけ作物ジェスチャーを開始する", () => {
    expect(shouldStartCropGesture("farm", fieldBuildings, { x: 8, z: 8 }, false)).toBe(true);
    expect(shouldStartCropGesture("farm", fieldBuildings, { x: 7, z: 8 }, false)).toBe(false);
  });

  it("成熟作物の収穫は畑のセルとして捕捉する", () => {
    expect(shouldStartCropGesture("inspect", fieldBuildings, { x: 8, z: 8 }, true)).toBe(true);
  });
});
