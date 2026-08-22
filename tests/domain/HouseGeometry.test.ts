import { describe, expect, it } from "vitest";
import {
  HOUSE_BODY_TOP_Y,
  HOUSE_CHIMNEY_BOTTOM_Y,
  HOUSE_CHIMNEY_X,
  HOUSE_CHIMNEY_Z,
  HOUSE_ROOF_BASE_Y,
  getHouseRoofSurfaceY,
} from "../../src/scene/buildings/houseGeometry";

describe("House geometry", () => {
  it("keeps the roof base above the house body", () => {
    expect(HOUSE_ROOF_BASE_Y).toBeGreaterThan(HOUSE_BODY_TOP_Y);
  });

  it("keeps the chimney base above the sloped roof surface", () => {
    expect(HOUSE_CHIMNEY_BOTTOM_Y).toBeGreaterThanOrEqual(
      getHouseRoofSurfaceY(HOUSE_CHIMNEY_X, HOUSE_CHIMNEY_Z),
    );
  });
});
