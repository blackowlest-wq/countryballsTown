import { describe, expect, it } from "vitest";
import {
  FRONT_CIRCLE_Z,
  getFlagPresentation,
} from "../src/scene/residents/flagPresentation";

describe("Flag presentation", () => {
  it("places a circle-pattern flag on the ball's front", () => {
    expect(getFlagPresentation("circle")).toEqual({
      texturePattern: "solid",
      frontCircle: true,
    });
    expect(FRONT_CIRCLE_Z).toBeCloseTo(0.43, 5);
  });
});
