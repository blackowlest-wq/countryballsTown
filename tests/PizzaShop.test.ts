import { describe, expect, it } from "vitest";
import { PIZZA_Z_DIAGONAL_ROTATION } from "../src/scene/buildings/PizzaShop";

describe("PizzaShop", () => {
  it("PIZZA看板のZの斜線が右上から左下へつながる", () => {
    const upperEndpointX = -Math.sin(PIZZA_Z_DIAGONAL_ROTATION);
    const lowerEndpointX = Math.sin(PIZZA_Z_DIAGONAL_ROTATION);

    expect(upperEndpointX).toBeGreaterThan(0);
    expect(lowerEndpointX).toBeLessThan(0);
  });
});
