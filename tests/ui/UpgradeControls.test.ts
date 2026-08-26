import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { UpgradeControls } from "../../src/ui/UpgradeControls";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const factory = {
  id: "milk-factory-upgrade-ui-test",
  buildingId: "milk-factory",
  gridX: 8,
  gridY: 8,
} as const;

afterEach(() => {
  useGameStore.setState({ game: createInitialGameState(0), notice: null });
  document.body.replaceChildren();
});

describe("UpgradeControls", () => {
  it("現在レベルと次のコストを表示し、購入可能なら操作できる", async () => {
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        buildings: [factory],
        miningInventory: { ...initial.miningInventory, copper: 4 },
      },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(UpgradeControls, {
      buildingId: factory.id,
      upgradeTypes: ["production-speed"],
    })));
    const control = container.querySelector<HTMLButtonElement>('[data-upgrade-type="production-speed"]');
    expect(control).not.toBeNull();
    expect(control?.textContent).toContain("生産速度 Lv.0");
    expect(control?.textContent).toContain("🟤4");
    expect(control?.disabled).toBe(false);

    await act(async () => control?.click());
    expect(useGameStore.getState().game.buildingUpgrades[factory.id]).toEqual({
      "production-speed": 1,
    });
    expect(control?.textContent).toContain("生産速度 Lv.1");

    await act(async () => root.unmount());
  });

  it("素材不足では強化操作をdisabledにする", async () => {
    useGameStore.setState({ game: { ...createInitialGameState(0), buildings: [factory] } });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(UpgradeControls, {
      buildingId: factory.id,
      upgradeTypes: ["production-speed"],
    })));
    const control = container.querySelector<HTMLButtonElement>('[data-upgrade-type="production-speed"]');
    expect(control?.disabled).toBe(true);
    expect(control?.title).toBe("採掘素材が足りません");

    await act(async () => root.unmount());
  });
});
