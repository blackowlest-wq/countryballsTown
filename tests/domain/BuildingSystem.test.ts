import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import {
  canPlaceBuilding,
  moveBuilding,
  placeBuilding,
  removeBuilding,
} from "../../src/game/systems/BuildingSystem";
import type { GameState } from "../../src/game/types/Village";

describe("BuildingSystem", () => {
  it("空きセルへ建物を配置し、コインを消費する", () => {
    const result = placeBuilding(createInitialGameState(0), "flower", 8, 8, "flower-test");
    expect(result.success).toBe(true);
    expect(result.state.coins).toBe(90);
    expect(result.state.buildings.at(-1)).toMatchObject({ id: "flower-test", gridX: 8, gridY: 8 });
  });

  it("使用済みセル、マップ外、コイン不足では配置できない", () => {
    const initial = createInitialGameState(0);
    expect(placeBuilding(initial, "flower", 3, 3).reason).toBe("occupied");
    expect(placeBuilding(initial, "flower", 20, 20).reason).toBe("out-of-bounds");
    expect(placeBuilding({ ...initial, coins: 0 }, "flower", 8, 8).reason).toBe("not-enough-coins");
  });

  it("作物が育っているセルには建物を配置できない", () => {
    const initial = {
      ...createInitialGameState(0),
      crops: [{ type: "tomato" as const, gridX: 8, gridY: 8, plantedAt: 0 }],
    };
    expect(placeBuilding(initial, "flower", 8, 8).reason).toBe("occupied");
  });

  it("畑は1マス単位で配置できる", () => {
    const placed = placeBuilding(createInitialGameState(0), "field", 8, 8, "field-test");
    expect(placed).toMatchObject({
      success: true,
      building: { buildingId: "field", gridX: 8, gridY: 8 },
      state: { coins: 90 },
    });
  });

  it("地区を指定すると関連する建物だけ配置できる", () => {
    const initial = {
      ...createInitialGameState(0),
      coins: 1_000,
      unlockedBuildings: [...new Set([
        ...createInitialGameState(0).unlockedBuildings,
        "pizza-shop",
        "warehouse",
      ])],
    };

    expect(canPlaceBuilding(initial, "field", 8, 8, undefined, "agriculture").ok).toBe(true);
    expect(canPlaceBuilding(initial, "pizza-shop", 8, 8, undefined, "agriculture"))
      .toMatchObject({ ok: false, reason: "not-allowed-in-district" });
    expect(placeBuilding(initial, "pizza-shop", 12, 12, "pizza-test", 0, "commercial").success)
      .toBe(true);
  });

  it("柵と道路を1マス単位で配置できる", () => {
    const fence = placeBuilding(createInitialGameState(0), "fence", 8, 8, "fence-test");
    expect(fence).toMatchObject({
      success: true,
      building: { buildingId: "fence", gridX: 8, gridY: 8 },
      state: { coins: 90 },
    });

    const road = placeBuilding(fence.state, "road", 9, 8, "road-test");
    expect(road).toMatchObject({
      success: true,
      building: { buildingId: "road", gridX: 9, gridY: 8 },
      state: { coins: 85 },
    });
  });

  it("鉱石工房は必要な採掘素材をまとめて消費し、コインは消費しない", () => {
    const initial = {
      ...createInitialGameState(0),
      miningInventory: {
        ...createInitialGameState(0).miningInventory,
        copper: 8,
        iron: 5,
        crystal: 3,
      },
    };

    const placed = placeBuilding(initial, "ore-workshop", 12, 12, "ore-workshop-test");

    expect(placed).toMatchObject({
      success: true,
      building: { buildingId: "ore-workshop", gridX: 12, gridY: 12 },
      state: {
        coins: 100,
        miningInventory: { copper: 0, iron: 0, crystal: 0 },
      },
    });
  });

  it("鉱石工房の素材不足ではコインも素材も消費しない", () => {
    const initial = {
      ...createInitialGameState(0),
      miningInventory: {
        ...createInitialGameState(0).miningInventory,
        copper: 7,
        iron: 5,
        crystal: 3,
      },
    };

    const result = placeBuilding(initial, "ore-workshop", 12, 12, "ore-workshop-test");

    expect(result).toMatchObject({
      success: false,
      reason: "not-enough-mining-resources",
      state: initial,
    });
  });

  it("鉱石工房を移動しても採掘素材を再徴収しない", () => {
    const initial = {
      ...createInitialGameState(0),
      miningInventory: {
        ...createInitialGameState(0).miningInventory,
        copper: 8,
        iron: 5,
        crystal: 3,
      },
    };
    const placed = placeBuilding(initial, "ore-workshop", 12, 12, "ore-workshop-test");
    expect(placed.success).toBe(true);

    const moved = moveBuilding(placed.state, "ore-workshop-test", 14, 14);

    expect(moved).toMatchObject({
      success: true,
      state: { coins: 100, miningInventory: { copper: 0, iron: 0, crystal: 0 } },
    });
  });

  it("牛を配置すると採乳待ちが始まり、撤去すると生産情報も消える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "cow",
      8,
      8,
      "cow-test",
      1_000,
    );
    expect(placed).toMatchObject({
      success: true,
      state: {
        coins: 50,
        cowProductions: [{ buildingInstanceId: "cow-test", milkReadyAt: 31_000 }],
      },
    });

    const removed = removeBuilding(placed.state, "cow-test");
    expect(removed.success).toBe(true);
    expect(removed.state.cowProductions).toEqual([]);
  });

  it("牛乳工場を配置すると未設定の生産情報が登録され、撤去すると消える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "milk-factory",
      8,
      8,
      "factory-test",
    );
    expect(placed).toMatchObject({
      success: true,
      state: {
        coins: 20,
        milkFactoryProductions: [{
          buildingInstanceId: "factory-test",
          productType: null,
          nextProductionAt: null,
        }],
      },
    });

    const removed = removeBuilding(placed.state, "factory-test");
    expect(removed.success).toBe(true);
    expect(removed.state.milkFactoryProductions).toEqual([]);
  });

  it("豚を配置すると豚肉の収穫待ちが始まり、撤去すると生産情報も消える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "pig",
      8,
      8,
      "pig-test",
      1_000,
    );
    expect(placed).toMatchObject({
      success: true,
      state: {
        coins: 50,
        pigProductions: [{ buildingInstanceId: "pig-test", porkReadyAt: 31_000 }],
      },
    });

    const removed = removeBuilding(placed.state, "pig-test");
    expect(removed.success).toBe(true);
    expect(removed.state.pigProductions).toEqual([]);
  });

  it("鶏を配置すると採卵待ちが始まり、撤去すると生産情報も消える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "chicken",
      8,
      8,
      "chicken-test",
      1_000,
    );
    expect(placed).toMatchObject({
      success: true,
      state: {
        coins: 50,
        chickenProductions: [{ buildingInstanceId: "chicken-test", eggReadyAt: 31_000 }],
      },
    });

    const removed = removeBuilding(placed.state, "chicken-test");
    expect(removed.success).toBe(true);
    expect(removed.state.chickenProductions).toEqual([]);
  });

  it("牛・豚・鶏は合計5頭まで配置でき、上限到達後も既存の家畜は移動できる", () => {
    let state: GameState = {
      ...createInitialGameState(0),
      coins: 1_000,
      buildings: [],
    };
    const livestock = ["cow", "pig", "chicken", "cow", "pig"] as const;
    livestock.forEach((buildingId, index) => {
      const result = placeBuilding(state, buildingId, index * 2, 0, `${buildingId}-${index}`, 0);
      expect(result.success).toBe(true);
      state = result.state;
    });

    const blocked = placeBuilding(state, "chicken", 10, 0, "chicken-limit", 0);
    expect(blocked).toMatchObject({
      success: false,
      reason: "livestock-limit",
      state,
    });

    const moved = moveBuilding(state, "cow-0", 12, 12);
    expect(moved.success).toBe(true);
    expect(moved.building).toMatchObject({ gridX: 12, gridY: 12 });
  });

  it("豚肉工場を配置すると未設定の生産情報が登録され、撤去すると消える", () => {
    const placed = placeBuilding(
      createInitialGameState(0),
      "pork-factory",
      8,
      8,
      "pork-factory-test",
    );
    expect(placed).toMatchObject({
      success: true,
      state: {
        coins: 20,
        porkFactoryProductions: [{
          buildingInstanceId: "pork-factory-test",
          productType: null,
          nextProductionAt: null,
        }],
      },
    });

    const removed = removeBuilding(placed.state, "pork-factory-test");
    expect(removed.success).toBe(true);
    expect(removed.state.porkFactoryProductions).toEqual([]);
  });

  it("作物がある畑は移動・撤去できず、空なら操作できる", () => {
    const placed = placeBuilding(createInitialGameState(0), "field", 8, 8, "field-test");
    const growing = {
      ...placed.state,
      crops: [{ type: "tomato" as const, gridX: 8, gridY: 8, plantedAt: 0 }],
    };

    expect(moveBuilding(growing, "field-test", 12, 12)).toMatchObject({
      success: false,
      reason: "field-not-empty",
    });
    expect(removeBuilding(growing, "field-test")).toMatchObject({
      success: false,
      reason: "field-not-empty",
    });
    expect(moveBuilding(placed.state, "field-test", 12, 12).success).toBe(true);
    expect(removeBuilding(placed.state, "field-test").success).toBe(true);
  });

  it("配置した建物を移動・撤去できる", () => {
    const placed = placeBuilding(createInitialGameState(0), "flower", 8, 8, "flower-test");
    expect(placed.success).toBe(true);
    const moved = moveBuilding(placed.state, "flower-test", 12, 12);
    expect(moved.success).toBe(true);
    expect(moved.building).toMatchObject({ gridX: 12, gridY: 12 });
    const removed = removeBuilding(moved.state, "flower-test");
    expect(removed.success).toBe(true);
    expect(removed.state.buildings.some((building) => building.id === "flower-test")).toBe(false);
  });

  it("重複IDを持つ建物を配置・移動・撤去で一括変更しない", () => {
    const initial = createInitialGameState(0);
    const duplicated = {
      ...initial,
      unlockedBuildings: [...initial.unlockedBuildings, "onsen"],
      coins: 1_000,
      buildings: [
        ...initial.buildings,
        { id: "duplicate", buildingId: "flower", gridX: 2, gridY: 10 },
        { id: "duplicate", buildingId: "onsen", gridX: 12, gridY: 12 },
      ],
    };

    expect(placeBuilding(duplicated, "tree", 2, 12, "duplicate"))
      .toMatchObject({ success: false, reason: "duplicate-id", state: duplicated });
    expect(moveBuilding(duplicated, "duplicate", 12, 16))
      .toMatchObject({ success: false, reason: "duplicate-id", state: duplicated });
    expect(removeBuilding(duplicated, "duplicate"))
      .toMatchObject({ success: false, reason: "duplicate-id", state: duplicated });
  });
});
