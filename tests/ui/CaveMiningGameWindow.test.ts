import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { CAVE_FUEL_PURCHASE_COST, CAVE_MAX_DEPTH, CAVE_VISIBLE_MAP_ROWS, CAVE_WIDTH } from "../../src/game/constants/gameConstants";
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
  it("洞窟の起動ボタンから別ウィンドウを開き、上下左右へ掘れる", async () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        caveMining: { ...base.caveMining, cellDamage: { "2:0": 6 } },
      },
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
    expect(container.querySelector('[data-direction="up"]')).not.toBeNull();
    expect(container.querySelector('[data-direction="right"]')).not.toBeNull();
    expect([...container.querySelectorAll<HTMLButtonElement>(".cave-mining-actions > .cave-dig-button")]
      .map((button) => button.dataset.direction))
      .toEqual(["left", "up", "down", "right"]);
    expect(container.querySelectorAll(".cave-mining-cell")).toHaveLength(
      CAVE_WIDTH * Math.min(CAVE_VISIBLE_MAP_ROWS, CAVE_MAX_DEPTH + 1),
    );
    expect(container.textContent).toContain("銅");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("上下左右");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-direction="left"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.querySelector(".cave-mining-window.is-digging")).not.toBeNull();
    expect(useGameStore.getState().game.miningInventory.copper).toBe(1);
    expect(container.textContent).toContain("銅");

    await act(async () => root.unmount());
  });

  it("硬い地面も掘れるが、削岩効率が下がることを表示する", async () => {
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
      .toContain("地面を削りました");
    expect(container.querySelector('[role="status"]')?.textContent)
      .toContain("2/14");

    await act(async () => root.unmount());
  });

  it("何もない場所への移動ではドリルの動作モーションを出さない", async () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        caveMining: {
          ...base.caveMining,
          position: { x: 3, depth: 1 },
          excavatedCells: ["3:0", "3:1"],
        },
      },
      isCaveMiningGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CaveMiningGameWindow)));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-direction="up"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.caveMining.position).toEqual({ x: 3, depth: 0 });
    expect(container.querySelector(".cave-mining-window.is-digging")).toBeNull();

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
    const stats = container.querySelector(".cave-mining-stats");
    const purchasePanel = container.querySelector(".cave-fuel-purchase");
    expect(stats && purchasePanel && Boolean(stats.compareDocumentPosition(purchasePanel) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    await act(async () => {
      purchaseButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(useGameStore.getState().game.caveMining.fuel).toBe(5);
    expect(container.textContent).toContain("燃料は削岩5ごとに1消費");

    await act(async () => root.unmount());
  });

  it("採掘リセットボタンで現在の地層を初期化する", async () => {
    const base = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...base,
        currentMap: "cave",
        caveMining: {
          ...base.caveMining,
          position: { x: 2, depth: 0 },
          excavatedCells: ["3:0", "2:0"],
          cellDamage: { "4:0": 4 },
        },
      },
      isCaveMiningGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CaveMiningGameWindow)));
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-action="reset-cave"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.caveMining.position).toEqual({ x: 3, depth: 0 });
    expect(useGameStore.getState().game.caveMining.excavatedCells).toEqual(["3:0"]);
    expect(useGameStore.getState().game.caveMining.cellDamage).toEqual({});
    expect(container.querySelector('[role="status"]')?.textContent).toContain("新しい地層");

    await act(async () => root.unmount());
  });
});
