import { describe, expect, it } from "vitest";
import { getCountryDefinition } from "../../src/game/data/countries";
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

  it("maps the USA canton to blue and keeps seven red-white stripes", () => {
    expect(getSphereFlagColorIndex("canton-stripes", { x: -0.3, y: 0.2, z: 0.4 })).toBe(2);
    expect(getSphereFlagColorIndex("canton-stripes", { x: 0, y: 0, z: 0.48 })).toBe(1);
    expect(getSphereFlagColorIndex("canton-stripes", { x: 0, y: -0.35, z: 0.4 })).toBe(0);
  });

  it("keeps China's yellow star offset from Japan's centered circle", () => {
    const chinaPattern = getCountryDefinition("china")?.flagPattern;

    expect(chinaPattern).toBe("china-star");
    expect(getSphereFlagColorIndex(chinaPattern!, { x: -0.16, y: 0.16, z: 0.4 })).toBe(1);
    expect(getSphereFlagColorIndex(chinaPattern!, { x: 0, y: 0.1, z: 0.4 })).toBe(0);
    expect(getSphereFlagColorIndex(chinaPattern!, { x: -0.16, y: 0.16, z: 0.05 })).toBe(0);
  });
});
