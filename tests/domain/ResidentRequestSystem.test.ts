import { describe, expect, it } from "vitest";
import {
  MAX_COINS,
  RESIDENT_REQUEST_COOLDOWN_MIN_MS,
  RESIDENT_REQUEST_DAILY_LIMIT,
  RESIDENT_REQUEST_INITIAL_DELAY_MS,
} from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  getResidentRequestDefinition,
  residentRequestDefinitions,
} from "../../src/game/data/residentRequests";
import { createInitialResident } from "../../src/game/systems/ResidentSystem";
import {
  advanceResidentRequest,
  describeResidentRequestEvent,
  getEligibleResidentRequests,
  maybeStartResidentRequest,
} from "../../src/game/systems/ResidentRequestSystem";
import type { GameState } from "../../src/game/types/Village";
import { getLocalDateKey } from "../../src/utils/date";

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
  it("12種類のお願いを重複なしで定義する", () => {
    expect(residentRequestDefinitions).toHaveLength(12);
    expect(new Set(residentRequestDefinitions.map((definition) => definition.id)).size).toBe(12);

    const base = createInitialGameState(0);
    const allUnlocked = {
      ...base,
      buildings: [],
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

  it("すでに条件を満たしている建物のお願いを候補にしない", () => {
    const state = withActiveRequest("japan-hot-spring", "japan");
    state.activeResidentRequest = null;
    state.buildings = [
      ...state.buildings,
      { id: "onsen-existing", buildingId: "onsen", gridX: 12, gridY: 12 },
    ];

    expect(getEligibleResidentRequests(state).map((definition) => definition.id))
      .not.toContain("japan-hot-spring");
  });

  it("お願い開始時に村にある対象建物を進捗へ反映する", () => {
    const state: GameState = {
      ...createInitialGameState(0),
      nextResidentRequestAt: 0,
      lastResidentRequestDefinitionId: "poland-tree-shade",
      buildings: [
        ...createInitialGameState(0).buildings,
        { id: "flower-existing", buildingId: "flower", gridX: 2, gridY: 10 },
      ],
    };

    const result = maybeStartResidentRequest(state, 1_000, () => 0);
    expect(result.state.activeResidentRequest).toMatchObject({
      definitionId: "poland-flower-field",
      progress: 1,
    });
  });

  it("桜の木を木のお願いの進捗として数える", () => {
    const initial = createInitialGameState(0);
    const state: GameState = {
      ...initial,
      nextResidentRequestAt: 0,
      buildings: [
        ...initial.buildings.filter((building) => building.buildingId !== "tree"),
        { id: "cherry-request", buildingId: "cherry-tree", gridX: 8, gridY: 2 },
      ],
      unlockedBuildings: [...initial.unlockedBuildings, "cherry-tree"],
    };

    const result = maybeStartResidentRequest(state, 1_000, () => 0);
    expect(result.state.activeResidentRequest).toMatchObject({
      definitionId: "poland-tree-shade",
      progress: 1,
    });
  });

  it("進行中のお願いも既存の温泉だけで達成できる", () => {
    const state = withActiveRequest("japan-hot-spring", "japan");
    state.buildings = [
      ...state.buildings,
      { id: "onsen-existing", buildingId: "onsen", gridX: 12, gridY: 12 },
    ];

    const result = advanceResidentRequest(
      state,
      { type: "coins-earned", amount: 0 },
      5_000,
      () => 0,
    );
    expect(result.event).toMatchObject({ type: "completed", definitionId: "japan-hot-spring" });
    expect(result.state.activeResidentRequest).toBeNull();
  });

  it("最初と達成後のお願いに十分な休止時間を設ける", () => {
    expect(RESIDENT_REQUEST_INITIAL_DELAY_MS).toBeGreaterThanOrEqual(60_000);
    expect(RESIDENT_REQUEST_COOLDOWN_MIN_MS).toBeGreaterThanOrEqual(120_000);
  });

  it("同じ暦日に開始するお願いを3回までに制限する", () => {
    const now = new Date(2026, 7, 19, 12).getTime();
    let state: GameState = {
      ...createInitialGameState(now),
      nextResidentRequestAt: 0,
    };

    for (let count = 0; count < RESIDENT_REQUEST_DAILY_LIMIT; count += 1) {
      const started = maybeStartResidentRequest(state, now + count, () => 0);
      expect(started.event?.type).toBe("started");
      state = {
        ...started.state,
        activeResidentRequest: null,
        nextResidentRequestAt: 0,
      };
    }

    const blocked = maybeStartResidentRequest(state, now + 10, () => 0);
    expect(blocked.event).toBeUndefined();
    expect(blocked.state.activeResidentRequest).toBeNull();
    expect(blocked.state.residentRequestsStartedToday).toBe(RESIDENT_REQUEST_DAILY_LIMIT);
  });

  it("日付が変わるとお願いの回数をリセットする", () => {
    const previousDay = new Date(2026, 7, 18, 12).getTime();
    const nextDay = new Date(2026, 7, 19, 12).getTime();
    const state: GameState = {
      ...createInitialGameState(previousDay),
      nextResidentRequestAt: 0,
      residentRequestsStartedToday: RESIDENT_REQUEST_DAILY_LIMIT,
    };

    const result = maybeStartResidentRequest(state, nextDay, () => 0);
    expect(result.event?.type).toBe("started");
    expect(result.state.residentRequestDayKey).toBe(getLocalDateKey(nextDay));
    expect(result.state.residentRequestsStartedToday).toBe(1);
  });

  it("村にある対象建物数を反映し、達成時に報酬と喜びを与える", () => {
    let state = withActiveRequest("japan-more-flowers", "japan");
    state = {
      ...state,
      buildings: [
        ...state.buildings,
        { id: "request-flower-1", buildingId: "flower", gridX: 2, gridY: 10 },
      ],
    };
    state = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "flower" },
      1_000,
    ).state;
    expect(state.activeResidentRequest?.progress).toBe(1);

    state = {
      ...state,
      buildings: [
        ...state.buildings,
        { id: "request-flower-2", buildingId: "flower", gridX: 3, gridY: 10 },
      ],
    };
    state = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "flower" },
      2_000,
    ).state;
    state = {
      ...state,
      buildings: [
        ...state.buildings,
        { id: "request-flower-3", buildingId: "flower", gridX: 4, gridY: 10 },
      ],
    };
    const completed = advanceResidentRequest(
      state,
      { type: "building-placed", buildingId: "flower" },
      3_000,
      () => 0,
    );

    expect(completed.event).toMatchObject({ type: "completed", rewardCoins: 5 });
    expect(completed.state.coins).toBe(105);
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
    expect(result.event).toMatchObject({ type: "completed", rewardCoins: 3 });
    expect(result.state.coins).toBe(123);
  });

  it("お願い報酬は所持コイン上限までの差額だけ付与する", () => {
    const state = withActiveRequest("poland-village-savings", "poland", MAX_COINS - 1);
    const result = advanceResidentRequest(
      state,
      { type: "coins-earned", amount: 20 },
      5_000,
      () => 0,
    );

    expect(result.event).toMatchObject({ type: "completed", rewardCoins: 1 });
    expect(result.state.coins).toBe(MAX_COINS);
  });

  it("お願い達成通知の報酬コインを整数表示する", () => {
    const notice = describeResidentRequestEvent({
      type: "completed",
      definitionId: "italy-festival-savings",
      residentId: "request-italy",
      rewardCoins: 7.9,
    });

    expect(notice).toContain("コイン +7");
    expect(notice).not.toContain("コイン +7.9");
  });
});
