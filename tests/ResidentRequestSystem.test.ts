import { describe, expect, it } from "vitest";
import { RESIDENT_REQUEST_COOLDOWN_MIN_MS } from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  getResidentRequestDefinition,
  residentRequestDefinitions,
} from "../src/game/data/residentRequests";
import { createInitialResident } from "../src/game/systems/ResidentSystem";
import {
  advanceResidentRequest,
  getEligibleResidentRequests,
  maybeStartResidentRequest,
} from "../src/game/systems/ResidentRequestSystem";
import type { GameState } from "../src/game/types/Village";

function withActiveRequest(
  definitionId: string,
  countryId: string,
  coins = 100,
): GameState {
  const base = createInitialGameState(0);
  const resident = createInitialResident(countryId, { x: 8, z: 8 }, `request-${countryId}`);
  return {
    ...base,
    coins,
    residents: [resident],
    unlockedCountries: [countryId],
    unlockedBuildings: ["tree", "flower", "onsen", "torii", "pizza-shop"],
    activeResidentRequest: {
      definitionId,
      residentId: resident.id,
      progress: 0,
      startedAt: 0,
    },
  };
}

describe("ResidentRequestSystem", () => {
  it("10種類のお願いを重複なしで定義する", () => {
    expect(residentRequestDefinitions).toHaveLength(10);
    expect(new Set(residentRequestDefinitions.map((definition) => definition.id)).size).toBe(10);

    const base = createInitialGameState(0);
    const allUnlocked = {
      ...base,
      residents: [
        base.residents[0],
        createInitialResident("japan", { x: 8, z: 8 }),
        createInitialResident("italy", { x: 10, z: 8 }),
      ],
      unlockedBuildings: ["tree", "flower", "onsen", "torii", "pizza-shop"],
    };
    expect(getEligibleResidentRequests(allUnlocked)).toHaveLength(10);
  });

  it("予定時刻まではお願いを開始しない", () => {
    const state = createInitialGameState(0);
    const result = maybeStartResidentRequest(state, state.nextResidentRequestAt - 1, () => 0);
    expect(result.state.activeResidentRequest).toBeNull();
    expect(result.event).toBeUndefined();
  });

  it("現在いる住民と解放済み建物からお願いを選ぶ", () => {
    const state = { ...createInitialGameState(0), nextResidentRequestAt: 0 };
    const eligible = getEligibleResidentRequests(state);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.every((definition) => definition.countryId === "poland")).toBe(true);

    const result = maybeStartResidentRequest(state, 1_000, () => 0.99);
    const active = result.state.activeResidentRequest;
    expect(active).not.toBeNull();
    expect(getResidentRequestDefinition(active?.definitionId ?? "")?.countryId).toBe("poland");
    expect(result.event?.type).toBe("started");
  });

  it("直前と同じお願いを連続で選ばない", () => {
    const state = {
      ...createInitialGameState(0),
      nextResidentRequestAt: 0,
      lastResidentRequestDefinitionId: "poland-tree-shade",
    };
    const result = maybeStartResidentRequest(state, 1_000, () => 0);
    expect(result.state.activeResidentRequest?.definitionId).not.toBe("poland-tree-shade");
  });

  it("対象の建物を置くたびに進み、達成時に報酬と喜びを与える", () => {
    let state = withActiveRequest("japan-more-flowers", "japan");
    state = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "flower" },
      1_000,
    ).state;
    expect(state.activeResidentRequest?.progress).toBe(1);

    state = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "flower" },
      2_000,
    ).state;
    const completed = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "flower" },
      3_000,
      () => 0,
    );

    expect(completed.event).toMatchObject({ type: "completed", rewardCoins: 50 });
    expect(completed.state.coins).toBe(150);
    expect(completed.state.activeResidentRequest).toBeNull();
    expect(completed.state.nextResidentRequestAt).toBe(
      3_000 + RESIDENT_REQUEST_COOLDOWN_MIN_MS,
    );
    expect(completed.state.residents[0]).toMatchObject({
      state: "action",
      motion: "happy",
    });
  });

  it("対象外の建物では進捗を増やさない", () => {
    const state = withActiveRequest("japan-more-flowers", "japan");
    const result = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "tree" },
      1_000,
    );
    expect(result.state.activeResidentRequest?.progress).toBe(0);
    expect(result.event).toBeUndefined();
  });

  it("獲得コイン数を積み上げてお願いを達成する", () => {
    const state = withActiveRequest("poland-village-savings", "poland", 120);
    const result = advanceResidentRequest(
      state,
      { type: "coins-earned", amount: 20 },
      5_000,
      () => 0,
    );
    expect(result.event).toMatchObject({ type: "completed", rewardCoins: 30 });
    expect(result.state.coins).toBe(150);
  });
});
