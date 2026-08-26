import { describe, expect, it } from "vitest";
import {
  COW_MILK_AMOUNT,
  COW_MILK_INTERVAL_MS,
} from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import type { CowProduction } from "../../src/game/types/Cow";
import { createLivestockProductionModule } from "../../src/game/systems/LivestockProductionSystem";

const cowModule = createLivestockProductionModule<CowProduction>({
  buildingId: "cow",
  stateKey: "cowProductions",
  readyAtKey: "milkReadyAt",
  inventoryKey: "milk",
  intervalMs: COW_MILK_INTERVAL_MS,
  amount: COW_MILK_AMOUNT,
});

const cowBuildings = [
  { id: "cow-2", buildingId: "cow", gridX: 2, gridY: 2 },
  { id: "cow-1", buildingId: "cow", gridX: 1, gridY: 1 },
  { id: "tree-1", buildingId: "tree", gridX: 3, gridY: 3 },
] as const;

describe("LivestockProductionSystem", () => {
  it("登録・重複登録・撤去のno-opが状態identityを保つ", () => {
    const initial = createInitialGameState(0);
    const registered = cowModule.register(initial, "cow-1", 1_000);
    expect(registered.cowProductions).toEqual([{
      buildingInstanceId: "cow-1",
      milkReadyAt: 1_000 + COW_MILK_INTERVAL_MS,
    }]);
    expect(cowModule.register(registered, "cow-1", 2_000)).toBe(registered);
    expect(cowModule.remove(registered, "missing-cow")).toBe(registered);
    expect(cowModule.remove(registered, "cow-1").cowProductions).toEqual([]);
  });

  it("準備状態・収穫・在庫加算・次回予定を共通Interfaceから観測できる", () => {
    const initial = {
      ...createInitialGameState(0),
      cowProductions: [{ buildingInstanceId: "cow-1", milkReadyAt: 10_000 }],
    };
    expect(cowModule.isReady(initial.cowProductions[0], 9_999)).toBe(false);

    const waiting = cowModule.collect(initial, "cow-1", 9_999);
    expect(waiting).toEqual({ outcome: "not-ready", state: initial });
    expect(cowModule.collect(initial, "missing-cow", 10_000)).toEqual({
      outcome: "not-found",
      state: initial,
    });

    const collected = cowModule.collect(initial, "cow-1", 10_000);
    expect(collected.outcome).toBe("collected");
    expect(collected.state.inventory.milk).toBe(COW_MILK_AMOUNT);
    expect(collected.state.cowProductions[0].milkReadyAt)
      .toBe(10_000 + COW_MILK_INTERVAL_MS);
  });

  it("建物順に正規化し、不正・重複・孤立を除き、正規化済み入力を再利用する", () => {
    const canonical = [
      { buildingInstanceId: "cow-2", milkReadyAt: 500 },
      { buildingInstanceId: "cow-1", milkReadyAt: 700 },
    ];
    expect(cowModule.normalize(canonical, cowBuildings, 1_000)).toBe(canonical);

    const normalized = cowModule.normalize([
      { buildingInstanceId: "cow-1", milkReadyAt: 800 },
      { buildingInstanceId: "cow-1", milkReadyAt: 900 },
      { buildingInstanceId: "orphan", milkReadyAt: 1_000 },
      { buildingInstanceId: "cow-2", milkReadyAt: Number.NaN },
    ], cowBuildings, 1_000);
    expect(normalized).toEqual([
      { buildingInstanceId: "cow-2", milkReadyAt: 1_000 + COW_MILK_INTERVAL_MS },
      { buildingInstanceId: "cow-1", milkReadyAt: 800 },
    ]);
  });
});
