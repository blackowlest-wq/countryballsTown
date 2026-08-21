import { describe, expect, it } from "vitest";
import { GRID_SIZE } from "../src/game/constants/gameConstants";
import {
  getRiverCenterX,
  getRiverPathPoints,
  SEA_START_X,
} from "../src/game/systems/MapSystem";

function getRenderedSeaWidth(): number {
  const seaStartWorldX = SEA_START_X - GRID_SIZE / 2 + 0.5;
  return GRID_SIZE / 2 - seaStartWorldX;
}

describe("sea and river map geometry", () => {
  it("川の下流が海岸線で止まる", () => {
    const upstreamX = getRiverCenterX(2);
    const downstreamX = getRiverCenterX(18.5);

    expect(downstreamX).toBeLessThanOrEqual(SEA_START_X);
    expect(downstreamX - upstreamX).toBeGreaterThan(3.5);
  });

  it("海の面積が十分に確保されている", () => {
    expect(getRenderedSeaWidth()).toBeGreaterThanOrEqual(6);
  });

  it("川の中心線が連続して滑らかにつながっている", () => {
    const path = getRiverPathPoints();
    const largestStep = Math.max(...path.slice(1).map((point, index) => {
      const previous = path[index];
      return Math.hypot(point.x - previous.x, point.z - previous.z);
    }));

    expect(path.length).toBeGreaterThan(24);
    expect(largestStep).toBeLessThan(0.6);
  });
});
