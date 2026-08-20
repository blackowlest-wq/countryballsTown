import { describe, expect, it } from "vitest";
import { getAnimalWanderTransform } from "../src/scene/buildings/animalWander";

describe("animal wandering", () => {
  it("keeps animals within their building cell", () => {
    for (let elapsedTime = 0; elapsedTime <= 120; elapsedTime += 0.5) {
      const transform = getAnimalWanderTransform(elapsedTime, "cow-1");
      expect(Math.abs(transform.x)).toBeLessThanOrEqual(0.36);
      expect(Math.abs(transform.z)).toBeLessThanOrEqual(0.3);
    }
  });

  it("is deterministic and gives each animal its own route", () => {
    const first = getAnimalWanderTransform(12.5, "cow-1");
    const repeat = getAnimalWanderTransform(12.5, "cow-1");
    const second = getAnimalWanderTransform(12.5, "pig-1");

    expect(repeat).toEqual(first);
    expect(second).not.toEqual(first);
  });

  it("travels a visible distance instead of only pivoting", () => {
    const start = getAnimalWanderTransform(0, "cow-1");
    const furthestDistance = Array.from({ length: 10 }, (_, index) => index + 1)
      .map((elapsedTime) => getAnimalWanderTransform(elapsedTime * 0.5, "cow-1"))
      .reduce((furthest, transform) => Math.max(
        furthest,
        Math.hypot(transform.x - start.x, transform.z - start.z),
      ), 0);

    expect(furthestDistance).toBeGreaterThan(0.25);
  });

  it("does not rotate while it wanders", () => {
    const transform = getAnimalWanderTransform(4, "cow-1");

    expect(Object.keys(transform)).toEqual(["x", "z"]);
  });
});
