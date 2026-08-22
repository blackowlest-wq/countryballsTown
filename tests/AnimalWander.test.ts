import { describe, expect, it } from "vitest";
import {
  getAnimalWanderTransform,
  ANIMAL_WANDER_MAP_MARGIN,
} from "../src/scene/buildings/animalWander";
import { GRID_SIZE } from "../src/game/constants/gameConstants";

describe("animal wandering", () => {
  it("starts at the building and then travels freely across the village", () => {
    const origin = { x: -7.5, z: -6.5 };
    const start = getAnimalWanderTransform(0, "cow-1", origin);
    const furthestDistance = Array.from({ length: 240 }, (_, index) => index * 0.5)
      .map((elapsedTime) => getAnimalWanderTransform(elapsedTime, "cow-1", origin))
      .reduce((furthest, transform) => Math.max(
        furthest,
        Math.hypot(transform.x - start.x, transform.z - start.z),
      ), 0);

    expect(start).toMatchObject({ x: 0, z: 0 });
    expect(Number.isFinite(start.rotationY)).toBe(true);
    expect(furthestDistance).toBeGreaterThan(2);
  });

  it("keeps the animal inside the village map", () => {
    const origins = [
      { x: -9.5, z: -9.5 },
      { x: 9.5, z: 9.5 },
    ];
    const mapMin = -GRID_SIZE / 2;
    const mapMax = GRID_SIZE / 2;
    for (const origin of origins) {
      for (let elapsedTime = 0; elapsedTime <= 120; elapsedTime += 0.5) {
        const transform = getAnimalWanderTransform(elapsedTime, "cow-1", origin);
        const worldX = origin.x + transform.x;
        const worldZ = origin.z + transform.z;
        expect(worldX).toBeGreaterThanOrEqual(mapMin);
        expect(worldX).toBeLessThanOrEqual(mapMax);
        expect(worldZ).toBeGreaterThanOrEqual(mapMin);
        expect(worldZ).toBeLessThanOrEqual(mapMax);
      }
    }
    expect(ANIMAL_WANDER_MAP_MARGIN).toBeGreaterThan(0);
  });

  it("does not cross a continuous fence line", () => {
    const fences = Array.from({ length: 19 }, (_, index) => ({
      x: 0,
      z: index - 9,
    }));
    const origin = { x: -5, z: 0 };

    for (let elapsedTime = 0; elapsedTime <= 120; elapsedTime += 0.5) {
      const transform = getAnimalWanderTransform(elapsedTime, "cow-1", origin, fences);
      const worldX = origin.x + transform.x;
      expect(worldX).toBeLessThan(-1.2);
    }
  });

  it("keeps an animal inside a closed fence pen", () => {
    const fences = [
      ...Array.from({ length: 9 }, (_, index) => ({ x: -4 + index, z: -4 })),
      ...Array.from({ length: 9 }, (_, index) => ({ x: -4 + index, z: 4 })),
      ...Array.from({ length: 7 }, (_, index) => ({ x: -4, z: -3 + index })),
      ...Array.from({ length: 7 }, (_, index) => ({ x: 4, z: -3 + index })),
    ];
    const origin = { x: 0, z: 0 };

    for (let elapsedTime = 0; elapsedTime <= 240; elapsedTime += 0.25) {
      const transform = getAnimalWanderTransform(elapsedTime, "cow-pen", origin, fences);
      const worldX = origin.x + transform.x;
      const worldZ = origin.z + transform.z;
      expect(Math.abs(worldX)).toBeLessThan(3);
      expect(Math.abs(worldZ)).toBeLessThan(3);
    }
  });

  it("is deterministic and gives each animal its own route", () => {
    const first = getAnimalWanderTransform(12.5, "cow-1", { x: 0, z: 0 });
    const repeat = getAnimalWanderTransform(12.5, "cow-1", { x: 0, z: 0 });
    const second = getAnimalWanderTransform(12.5, "pig-1", { x: 0, z: 0 });

    expect(repeat).toEqual(first);
    expect(second).not.toEqual(first);
  });

  it("starts at the specified placement instead of jumping on mount", () => {
    const origin = { x: 4.5, z: -2.5 };
    const transform = getAnimalWanderTransform(0, "chicken-1", origin);

    expect(transform).toMatchObject({ x: 0, z: 0 });
  });

  it("travels a visible distance instead of only pivoting", () => {
    const start = getAnimalWanderTransform(0, "cow-1", { x: 0, z: 0 });
    const furthestDistance = Array.from({ length: 10 }, (_, index) => index + 1)
      .map((elapsedTime) => getAnimalWanderTransform(elapsedTime * 0.5, "cow-1", { x: 0, z: 0 }))
      .reduce((furthest, transform) => Math.max(
        furthest,
        Math.hypot(transform.x - start.x, transform.z - start.z),
      ), 0);

    expect(furthestDistance).toBeGreaterThan(0.25);
  });

  it("faces the direction it is currently moving", () => {
    const start = getAnimalWanderTransform(0, "cow-heading");
    const middle = getAnimalWanderTransform(4, "cow-heading");
    const directionX = middle.x - start.x;
    const directionZ = middle.z - start.z;

    expect(Math.hypot(directionX, directionZ)).toBeGreaterThan(0.1);
    expect(middle.rotationY).toBeCloseTo(Math.atan2(-directionZ, directionX));
  });
});
