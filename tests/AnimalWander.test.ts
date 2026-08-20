import { describe, expect, it } from "vitest";
import { getAnimalWanderTransform } from "../src/scene/buildings/animalWander";

describe("animal wandering", () => {
  it("keeps animals within their building cell", () => {
    for (let elapsedTime = 0; elapsedTime <= 120; elapsedTime += 0.5) {
      const transform = getAnimalWanderTransform(elapsedTime, "cow-1");
      expect(Math.abs(transform.x)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(transform.z)).toBeLessThanOrEqual(0.2);
    }
  });

  it("is deterministic and gives each animal its own route", () => {
    const first = getAnimalWanderTransform(12.5, "cow-1");
    const repeat = getAnimalWanderTransform(12.5, "cow-1");
    const second = getAnimalWanderTransform(12.5, "pig-1");

    expect(repeat).toEqual(first);
    expect(second).not.toEqual(first);
  });
});
