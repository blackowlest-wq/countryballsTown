// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CROP_MATURE_STAGE_MS } from "../src/game/constants/gameConstants";
import { createInitialGameState } from "../src/game/core/GameState";
import { CropRenderer } from "../src/scene/crops/CropRenderer";
import { useGameStore } from "../src/store/gameStore";

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedCropType: "wheat",
    notice: null,
  });
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("CropRenderer", () => {
  it("作物メニューを開いていなくても成熟した作物をタップして収穫できる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        wheatSeeds: 7,
        crops: [{
          type: "wheat",
          gridX: 8,
          gridY: 8,
          plantedAt: Date.now() - CROP_MATURE_STAGE_MS,
        }],
      },
      interactionMode: "inspect",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CropRenderer)));
    const matureCrop = container.querySelector('[name="収穫できる小麦"]');
    expect(matureCrop).not.toBeNull();

    await act(async () => {
      matureCrop?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.crops).toHaveLength(0);
    expect(useGameStore.getState().game.wheat).toBe(1);
    expect(useGameStore.getState().game.wheatSeeds).toBe(9);
    expect(useGameStore.getState().notice).toContain("小麦1個");

    await act(async () => root.unmount());
  });

  it("作物モード中でも成熟した作物をタップして収穫できる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        wheatSeeds: 7,
        crops: [{
          type: "wheat",
          gridX: 8,
          gridY: 8,
          plantedAt: Date.now() - CROP_MATURE_STAGE_MS,
        }],
      },
      interactionMode: "farm",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CropRenderer)));
    const matureCrop = container.querySelector('[name="収穫できる小麦"]');
    expect(matureCrop).not.toBeNull();

    await act(async () => {
      matureCrop?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(useGameStore.getState().game.crops).toHaveLength(0);
    expect(useGameStore.getState().game.wheat).toBe(1);

    await act(async () => root.unmount());
  });

  it("成熟作物の上をスワイプすると収穫できる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        wheatSeeds: 7,
        crops: [{
          type: "wheat",
          gridX: 8,
          gridY: 8,
          plantedAt: Date.now() - CROP_MATURE_STAGE_MS,
        }],
      },
      interactionMode: "farm",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CropRenderer)));
    const matureCrop = container.querySelector('[name="収穫できる小麦"]');
    expect(matureCrop).not.toBeNull();
    const pointerEvent = (type: string): PointerEvent => {
      const event = new Event(type, { bubbles: true }) as PointerEvent;
      Object.defineProperties(event, {
        pointerId: { value: 3 },
        buttons: { value: 1 },
      });
      return event;
    };

    await act(async () => {
      matureCrop?.dispatchEvent(pointerEvent("pointerdown"));
      matureCrop?.dispatchEvent(pointerEvent("pointermove"));
    });

    expect(useGameStore.getState().game.crops).toHaveLength(0);
    expect(useGameStore.getState().game.wheat).toBe(1);

    await act(async () => {
      matureCrop?.dispatchEvent(pointerEvent("pointerup"));
    });

    await act(async () => root.unmount());
  });

  it("米は小麦とは異なる見た目で成熟する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const initial = createInitialGameState(0);
    useGameStore.setState({
      game: {
        ...initial,
        riceSeeds: 4,
        crops: [{
          type: "rice",
          gridX: 8,
          gridY: 8,
          plantedAt: Date.now() - CROP_MATURE_STAGE_MS,
        }],
      },
      interactionMode: "inspect",
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(CropRenderer)));
    expect(container.querySelector('[name="収穫できる米"]')).not.toBeNull();
    expect(container.querySelector('[name="収穫できる小麦"]')).toBeNull();

    await act(async () => root.unmount());
  });
});
