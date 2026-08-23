
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FISHING_ROD_COST } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { FishingGamePanel } from "../../src/ui/FishingGamePanel";
import { FishingPromptPanel } from "../../src/ui/FishingPromptPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    isEncyclopediaOpen: false,
    isFishingPromptOpen: false,
    isFishingGameOpen: false,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("fishing panels", () => {
  it("確認画面から2D魚釣り画面へ進める", async () => {
    useGameStore.setState({
      game: { ...createInitialGameState(0), coins: FISHING_ROD_COST },
      isFishingPromptOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FishingPromptPanel)));
    expect(container.textContent).toContain("釣り竿を買う");

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("釣り竿を買う"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game).toMatchObject({
      coins: 0,
      hasFishingRod: true,
    });

    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("釣りを始める"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState()).toMatchObject({
      isFishingPromptOpen: false,
      isFishingGameOpen: true,
    });
    await act(async () => root.unmount());
  });

  it("食いつき後にゲージを範囲内で止めると魚をゲットできる", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    useGameStore.setState({
      game: createInitialGameState(0),
      isFishingGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FishingGamePanel)));
    expect(container.querySelector(".fishing-stage-art .fishing-rod")).not.toBeNull();
    expect(container.querySelector(".fishing-stage-art .fishing-line")).not.toBeNull();
    expect(container.querySelector(".fishing-bobber-top")).not.toBeNull();
    expect(container.querySelector(".fishing-bobber-body")).not.toBeNull();
    expect(container.querySelector(".fishing-ripples")).not.toBeNull();
    await act(async () => vi.advanceTimersByTime(1_200));
    const actionSlot = container.querySelector(".fishing-action-slot");
    const biteButton = container.querySelector('[aria-label="魚が食いついたのでタップ"]');
    expect(actionSlot).not.toBeNull();
    expect(biteButton?.closest(".fishing-action-slot")).toBe(actionSlot);

    await act(async () => {
      biteButton
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const stopButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("ここで止める"));
    expect(stopButton?.closest(".fishing-action-slot")).toBe(actionSlot);
    await act(async () => {
      stopButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("魚を釣り上げました！");
    expect(useGameStore.getState().game.fishInventory.sardine).toBe(1);
    const retryButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("もう一度釣る"));
    expect(retryButton?.closest(".fishing-action-slot")).toBe(actionSlot);
    await act(async () => root.unmount());
  });

  it("停止時に最後の更新からの経過時間も含めて判定する", async () => {
    vi.useFakeTimers();
    const realPerformanceNow = performance.now.bind(performance);
    let elapsedMs = 0;
    vi.spyOn(performance, "now").mockImplementation(() => realPerformanceNow() + elapsedMs);
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.05857142857142857)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.05857142857142857)
      .mockReturnValueOnce(0)
      .mockReturnValue(0);
    useGameStore.setState({
      game: createInitialGameState(0),
      isFishingGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FishingGamePanel)));
    await act(async () => vi.advanceTimersByTime(1_200));
    await act(async () => {
      container.querySelector<HTMLButtonElement>("[aria-label=\"魚が食いついたのでタップ\"]")
        ?.click();
    });
    elapsedMs = 100;
    await act(async () => vi.advanceTimersByTime(100));
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("ここで止める"))
        ?.click();
    });

    expect(container.textContent).toContain("魚を釣り上げました！");
    expect(useGameStore.getState().game.fishInventory.sardine).toBe(1);
    await act(async () => root.unmount());
  });
});
