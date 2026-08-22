import { describe, expect, it } from "vitest";
import { PIG_PORK_AMOUNT, PIG_PORK_INTERVAL_MS } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { placeBuilding } from "../../src/game/systems/BuildingSystem";
import {
  collectPigPork,
  isPigPorkReady,
  normalizePigProductions,
} from "../../src/game/systems/PigSystem";

function createStateWithPig(now = 1_000) {
  const placed = placeBuilding(
    createInitialGameState(0),
    "pig",
    8,
    8,
    "pig-test",
    now,
  );
  if (!placed.success) throw new Error(`Could not place pig: ${placed.reason}`);
  return placed.state;
}

describe("PigSystem", () => {
  it("一定時間後に豚肉を収穫でき、豚は次の収穫待ちになる", () => {
    const state = createStateWithPig();
    const production = state.pigProductions[0];

    expect(isPigPorkReady(production, production.porkReadyAt - 1)).toBe(false);
    expect(isPigPorkReady(production, production.porkReadyAt)).toBe(true);

    const result = collectPigPork(state, "pig-test", production.porkReadyAt);
    expect(result.outcome).toBe("collected");
    expect(result.state.pork).toBe(PIG_PORK_AMOUNT);
    expect(result.state.buildings).toContainEqual({
      id: "pig-test",
      buildingId: "pig",
      gridX: 8,
      gridY: 8,
    });
    expect(result.state.pigProductions[0].porkReadyAt)
      .toBe(production.porkReadyAt + PIG_PORK_INTERVAL_MS);
  });

  it("未収穫・存在しない豚を区別する", () => {
    const state = createStateWithPig();
    const readyAt = state.pigProductions[0].porkReadyAt;
    expect(collectPigPork(state, "pig-test", readyAt - 1).outcome).toBe("not-ready");
    expect(collectPigPork(state, "missing-pig", readyAt).outcome).toBe("not-found");
  });

  it("保存データの豚情報を建物にそろえる", () => {
    const buildings = [
      { id: "pig-a", buildingId: "pig", gridX: 8, gridY: 8 },
      { id: "pig-b", buildingId: "pig", gridX: 10, gridY: 8 },
    ] as const;
    const normalized = normalizePigProductions([
      { buildingInstanceId: "pig-a", porkReadyAt: 5_000 },
      { buildingInstanceId: "missing", porkReadyAt: 6_000 },
    ], buildings, 10_000);

    expect(normalized).toEqual([
      { buildingInstanceId: "pig-a", porkReadyAt: 5_000 },
      { buildingInstanceId: "pig-b", porkReadyAt: 40_000 },
    ]);
  });
});
