
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

  it("食いつき後に魚を枠へ入れ続けると魚をゲットできる", async () => {
    vi.useFakeTimers();
    let elapsedMs = 0;
    vi.spyOn(performance, "now").mockImplementation(() => elapsedMs);
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
    expect(container.querySelector(".fishing-playfield")).not.toBeNull();
    expect(container.querySelector(".fishing-catch-frame")).not.toBeNull();
    expect(container.querySelector('[aria-label="捕獲ゲージ"]')).not.toBeNull();
    expect(container.textContent).toContain("タップ・スワイプで枠を移動");

    const playfield = container.querySelector<HTMLDivElement>(".fishing-playfield");
    vi.spyOn(playfield!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    await act(async () => {
      playfield?.dispatchEvent(new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 20,
        clientY: 0,
      }));
    });

    elapsedMs = 1_900;
    await act(async () => vi.advanceTimersByTime(1_900));

    expect(container.textContent).toContain("魚を釣り上げました！");
    expect(useGameStore.getState().game.fishInventory.sardine).toBe(1);
    const retryButton = [...container.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("もう一度釣る"));
    expect(retryButton?.closest(".fishing-action-slot")).toBe(actionSlot);
    await act(async () => root.unmount());
  });

  it("水中エリアをスワイプすると枠が指の位置へ追従する", async () => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    useGameStore.setState({
      game: createInitialGameState(0),
      isFishingGameOpen: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(FishingGamePanel)));
    await act(async () => vi.advanceTimersByTime(2_100));
    await act(async () => {
      container.querySelector<HTMLButtonElement>("[aria-label=\"魚が食いついたのでタップ\"]")
        ?.click();
    });

    const playfield = container.querySelector<HTMLDivElement>(".fishing-playfield");
    expect(playfield).not.toBeNull();
    vi.spyOn(playfield!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    await act(async () => {
      playfield?.dispatchEvent(new MouseEvent("pointerdown", {
        bubbles: true,
        clientX: 80,
        clientY: 20,
      }));
    });
    await act(async () => {
      playfield?.dispatchEvent(new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 35,
        clientY: 70,
      }));
    });

    const frame = container.querySelector<HTMLElement>(".fishing-catch-frame");
    expect(frame?.style.left).toBe("35%");
    expect(frame?.style.top).toBe("70%");
    expect(container.textContent).toContain("枠の中に魚を入れ続けよう！");
    await act(async () => root.unmount());
  });
});
