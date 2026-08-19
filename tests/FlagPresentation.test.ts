import { describe, expect, it } from "vitest";
import {
  FRONT_FLAG_Z,
  getFlagPresentation,
} from "../src/scene/residents/flagPresentation";

describe("Flag presentation", () => {
  it("places a circle-pattern flag on the ball's front", () => {
    expect(getFlagPresentation("circle")).toEqual({
      texturePattern: "solid",
      frontPattern: "circle",
    });
    expect(FRONT_FLAG_Z).toBeCloseTo(0.43, 5);
  });

  it("places a vertical tricolor flag on the ball's front", () => {
    expect(getFlagPresentation("vertical")).toEqual({
      texturePattern: "solid",
      frontPattern: "vertical",
    });
  });
});
