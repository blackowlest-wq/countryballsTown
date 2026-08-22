import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  advanceResidents,
  chooseResidentDestination,
  createInitialResident,
  getResidentStatusLabel,
} from "../../src/game/systems/ResidentSystem";
import { getMapArrivalPosition, getRiverCenterX } from "../../src/game/systems/MapSystem";

describe("sea and river resident activities", () => {
  it("海と川では釣りと川遊びが行動候補になる", () => {
    const state = { ...createInitialGameState(0), currentMap: "sea-and-river" as const };
    const resident = createInitialResident("poland", { x: 5, z: 5 });

    expect(chooseResidentDestination(state, resident, () => 0.1)).toMatchObject({
      motion: "fishing",
    });
    expect(chooseResidentDestination(state, resident, () => 0.3)).toMatchObject({
      motion: "river-play",
    });
  });

  it("限定行動の状態を住民パネル向けに説明できる", () => {
    expect(getResidentStatusLabel({
      ...createInitialResident("poland", { x: 5, z: 5 }),
      state: "action",
      motion: "fishing",
    })).toBe("釣りをしています");
    expect(getResidentStatusLabel({
      ...createInitialResident("poland", { x: 5, z: 5 }),
      state: "action",
      motion: "river-play",
    })).toBe("川で遊んでいます");
  });

  it("海と川の岸まで移動すると限定行動を開始する", () => {
    const initial = createInitialGameState(0);
    const resident = {
      ...initial.residents[0],
      position: getMapArrivalPosition("sea-and-river", 0),
      state: "idle" as const,
      nextDecisionAt: 0,
    };
    const state = {
      ...initial,
      currentMap: "sea-and-river" as const,
      residents: [resident],
    };

    const advanced = advanceResidents(state, 10_000, 10_000, () => 0.1);

    expect(advanced.residents[0]).toMatchObject({
      state: "action",
      motion: "fishing",
    });
  });

  it("海と川の住民は川を横断して移動できる", () => {
    const initial = createInitialGameState(0);
    const riverCenter = getRiverCenterX(10);
    const start = { x: riverCenter - 1.5, z: 10 };
    const destination = { x: riverCenter + 1.5, z: 10 };
    const state = {
      ...initial,
      currentMap: "sea-and-river" as const,
      residents: [{
        ...initial.residents[0],
        position: start,
        state: "walking" as const,
        motion: "idle" as const,
        destination,
      }],
    };

    const advanced = advanceResidents(state, 500, 500, () => 0.9);

    expect(advanced.residents[0].position.x).toBeGreaterThan(start.x);
    expect(advanced.residents[0].state).toBe("walking");
  });
});
