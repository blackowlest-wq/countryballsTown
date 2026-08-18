import { describe, expect, it } from "vitest";
import { getGroundPanDelta, type CameraPanBasis } from "../src/scene/cameraPan";

const isometricBasis: CameraPanBasis = {
  rightX: Math.SQRT1_2,
  rightZ: -Math.SQRT1_2,
  upX: -0.475,
  upZ: -0.475,
};

function projectWorldDisplacement(delta: { x: number; z: number }) {
  return {
    x: -(delta.x * isometricBasis.rightX + delta.z * isometricBasis.rightZ),
    y: -(delta.x * isometricBasis.upX + delta.z * isometricBasis.upZ),
  };
}

describe("Camera pan", () => {
  it("keeps the visible world under a finger swipe", () => {
    const swipe = { x: 24, y: 12 };
    const pan = getGroundPanDelta(swipe.x, swipe.y, 1, isometricBasis);
    const visibleWorldMovement = projectWorldDisplacement(pan);
    const scale = 0.045 * 35;

    expect(visibleWorldMovement.x).toBeCloseTo(swipe.x * scale, 5);
    expect(visibleWorldMovement.y).toBeCloseTo(-swipe.y * scale, 5);
  });
});
