import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { CAVE_FUEL_PURCHASE_COST, CAVE_MAX_DEPTH, CAVE_WIDTH } from "../../src/game/constants/gameConstants";
import { createInitialCaveMiningState } from "../../src/game/systems/CaveMiningSystem";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { CaveMiningGameWindow } from "../../src/ui/CaveMiningGameWindow";
import { CaveMiningLauncher } from "../../src/ui/CaveMiningLauncher";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    isCaveMiningGameOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("地面採掘ゲームの2Dウィンドウ", () => {
  it("洞窟の起動ボタンから別ウィンドウを開き、下や横へ掘れる", async () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), currentMap: "cave" },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(
      "div",
      null,
      createElement(CaveMiningLauncher),
      createElement(CaveMiningGameWindow),
    )));
    expect(container.textContent).toContain("地面採掘ゲーム");
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("開く"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.querySelector('[data-direction="left"]')).not.toBeNull();
    expect(container.querySelector('[data-direction="down"]')).not.toBeNull();
    expect(container.querySelector('[data-direction="right"]')).not.toBeNull();
    expect(container.querySelectorAll(".cave-mining-cell")).toHaveLength(CAVE_WIDTH * (CAVE_MAX_DEPTH + 1));

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-direction="left"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector(".cave-mining-window.is-digging")).not.toBeNull();
    expect(useGameStore.getState().game.miningInventory.copper).toBe(1);
    expect(container.textContent).toContain("銅");

    await act(async () => root.unmount());
  });

  it("固くて掘れない地面の理由をウィンドウ内に表示する", async () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), currentMap: "cave" },
      isCaveMiningGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CaveMiningGameWindow)));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-direction="right"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[role="status"]')?.textContent)
      .toContain("この地面は固くて掘れません");
    expect(container.querySelector('[role="status"]')?.textContent)
      .toContain("必要なドリル硬度は2、現在は1");

    await act(async () => root.unmount());
  });

  it("燃料が0なら購入ボタンを表示し、補給できる", async () => {
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        currentMap: "cave",
        coins: CAVE_FUEL_PURCHASE_COST,
        caveMining: { ...createInitialCaveMiningState(), fuel: 0 },
      },
      isCaveMiningGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CaveMiningGameWindow)));
    const purchaseButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("燃料を購入"));
    expect(purchaseButton).toBeDefined();

    await act(async () => {
      purchaseButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game.caveMining.fuel).toBe(5);
    expect(container.textContent).toContain("燃料は削岩5ごとに1消費");

    await act(async () => root.unmount());
  });
});
