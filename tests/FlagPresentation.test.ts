import { describe, expect, it } from "vitest";
import {
  CIRCLE_FLAG_CENTER_U,
  getFlagPresentation,
} from "../src/scene/residents/flagPresentation";

describe("Flag presentation", () => {
  it("places a circle-pattern flag on the ball's front", () => {
    expect(getFlagPresentation("circle")).toEqual({
      texturePattern: "circle",
      circleCenterU: 0.25,
    });
    expect(CIRCLE_FLAG_CENTER_U).toBeCloseTo(0.25, 5);
  });
});
