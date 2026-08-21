import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  getMapActivityPosition,
  getMapArrivalPosition,
  isMapPositionWalkable,
  travelToMap,
} from "../src/game/systems/MapSystem";

describe("MapSystem", () => {
  it("海と川へ移動すると現在地が変わり、住民全員が同じマップへ移動する", () => {
    const state = createInitialGameState(0);
    const moved = travelToMap(state, "sea-and-river", 5_000);

    expect(moved.currentMap).toBe("sea-and-river");
    expect(moved.residents).toHaveLength(state.residents.length);
    expect(moved.residents.map((resident) => resident.id))
      .toEqual(state.residents.map((resident) => resident.id));
    expect(moved.residents.map((resident) => resident.countryId))
      .toEqual(state.residents.map((resident) => resident.countryId));
    expect(moved.residents[0].position).toEqual(getMapArrivalPosition("sea-and-river", 0));
    expect(isMapPositionWalkable("sea-and-river", moved.residents[0].position)).toBe(true);
  });

  it("同じマップへの移動では状態を変更しない", () => {
    const state = createInitialGameState(0);
    expect(travelToMap(state, "village", 5_000)).toBe(state);
  });

  it("海岸と川辺の行動地点は水上ではなく歩ける岸にある", () => {
    for (let index = 0; index < 4; index += 1) {
      expect(isMapPositionWalkable(
        "sea-and-river",
        getMapArrivalPosition("sea-and-river", index),
      )).toBe(true);
      expect(isMapPositionWalkable(
        "sea-and-river",
        getMapActivityPosition("fishing", index),
      )).toBe(true);
      expect(isMapPositionWalkable(
        "sea-and-river",
        getMapActivityPosition("river-play", index),
      )).toBe(true);
    }

    const moved = travelToMap(createInitialGameState(0), "sea-and-river", 5_000);
    moved.residents.forEach((resident) => {
      expect(resident.destination).toBeDefined();
      if (resident.destination) {
        expect(isMapPositionWalkable("sea-and-river", resident.destination)).toBe(true);
      }
    });
  });
});
