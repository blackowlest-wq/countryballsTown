import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";

const factory = {
  id: "milk-factory-store-test",
  buildingId: "milk-factory",
  gridX: 8,
  gridY: 8,
} as const;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    notice: null,
  });
});

describe("building upgrade store interaction", () => {
  it("強化成功時に採掘素材を消費し、レベルを更新する", () => {
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        buildings: [factory],
        miningInventory: { ...initial.miningInventory, copper: 4 },
      },
    });

    expect(useGameStore.getState().upgradeBuilding(factory.id, "production-speed")).toBe(true);
    expect(useGameStore.getState().game).toMatchObject({
      miningInventory: { copper: 0 },
      buildingUpgrades: { [factory.id]: { "production-speed": 1 } },
    });
    expect(useGameStore.getState().notice).toContain("レベル1");
  });

  it("採掘素材不足の強化を拒否し、在庫とレベルを変えない", () => {
    const initial = createInitialGameState(0);
    const game = { ...initial, buildings: [factory] };
    useGameStore.setState({ game });

    expect(useGameStore.getState().upgradeBuilding(factory.id, "production-speed")).toBe(false);
    expect(useGameStore.getState().game).toBe(game);
    expect(useGameStore.getState().notice).toBe("採掘素材が足りません。");
  });
});
