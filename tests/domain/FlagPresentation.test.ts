import { describe, expect, it } from "vitest";
import {
  getFlagPresentation,
  getSphereFlagColorIndex,
} from "../../src/scene/residents/flagPresentation";

describe("Flag presentation", () => {
  it("places a circle-pattern flag on the ball's front", () => {
    expect(getFlagPresentation("circle")).toEqual({
      texturePattern: "circle",
      sphereSurface: true,
    });
  });

  it("keeps a vertical tricolor flag on the sphere surface", () => {
    expect(getFlagPresentation("vertical")).toEqual({
      texturePattern: "vertical",
      sphereSurface: true,
    });
  });

  it("maps Italy's local left, center, and right thirds to green, white, and red", () => {
    expect(getSphereFlagColorIndex("vertical", { x: -0.3, y: 0, z: 0.4 })).toBe(0);
    expect(getSphereFlagColorIndex("vertical", { x: 0, y: 0, z: 0.48 })).toBe(1);
    expect(getSphereFlagColorIndex("vertical", { x: 0.3, y: 0, z: 0.4 })).toBe(2);
  });
});
