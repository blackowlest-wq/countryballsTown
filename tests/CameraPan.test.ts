// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { OrthographicCamera } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getGroundPanDelta, type CameraPanBasis } from "../src/scene/cameraPan";
import { CameraController } from "../src/scene/CameraController";
import { createInitialGameState } from "../src/game/core/GameState";
import {
  beginCropGesture,
  endCropGesture,
} from "../src/scene/crops/cropGesture";
import { useGameStore } from "../src/store/gameStore";

const useThreeMock = vi.fn();

vi.mock("@react-three/fiber", () => ({
  useThree: () => useThreeMock(),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const isometricBasis: CameraPanBasis = {
  rightX: Math.SQRT1_2,
  rightZ: -Math.SQRT1_2,
  upX: -0.475,
  upZ: -0.475,
};

function projectWorldDisplacement(delta: { x: number; z: number }) {
  return {
    x: -(delta.x * isometricBasis.rightX + delta.z * isometricBasis.rightZ),
    y: -(delta.x * isometricBasis.upX + delta.z * isometricBasis.upZ),
  };
}

describe("Camera pan", () => {
  it("keeps the visible world under a finger swipe", () => {
    const swipe = { x: 24, y: 12 };
    const pan = getGroundPanDelta(swipe.x, swipe.y, 1, isometricBasis);
    const visibleWorldMovement = projectWorldDisplacement(pan);
    const scale = 0.045 * 35;

    expect(visibleWorldMovement.x).toBeCloseTo(swipe.x * scale, 5);
    expect(visibleWorldMovement.y).toBeCloseTo(-swipe.y * scale, 5);
  });

  it("moves the camera while the crop mode is active", async () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    camera.zoom = 40;
    const domElement = document.createElement("div");
    useThreeMock.mockReturnValue({ camera, gl: { domElement } });
    useGameStore.setState({
      game: createInitialGameState(0),
      interactionMode: "farm",
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => root.render(createElement(CameraController)));
    const initialPosition = camera.position.clone();
    const createPointerEvent = (
      type: string,
      clientX: number,
      clientY: number,
    ): PointerEvent => {
      const event = new Event(type) as PointerEvent;
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };

    await act(async () => {
      domElement.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      domElement.dispatchEvent(createPointerEvent("pointermove", 124, 112));
    });

    expect(camera.position.x).not.toBe(initialPosition.x);
    expect(camera.position.z).not.toBe(initialPosition.z);

    await act(async () => root.unmount());
    useGameStore.setState({ interactionMode: "inspect" });
  });

  it("prioritizes a crop harvest gesture over camera movement", async () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    camera.zoom = 40;
    const domElement = document.createElement("div");
    useThreeMock.mockReturnValue({ camera, gl: { domElement } });
    useGameStore.setState({
      game: createInitialGameState(0),
      interactionMode: "farm",
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => root.render(createElement(CameraController)));
    const initialPosition = camera.position.clone();
    const createPointerEvent = (
      type: string,
      clientX: number,
      clientY: number,
    ): PointerEvent => {
      const event = new Event(type) as PointerEvent;
      Object.defineProperties(event, {
        pointerId: { value: 2 },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };

    beginCropGesture(2);
    await act(async () => {
      domElement.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      domElement.dispatchEvent(createPointerEvent("pointermove", 124, 112));
    });

    expect(camera.position.x).toBe(initialPosition.x);
    expect(camera.position.z).toBe(initialPosition.z);

    endCropGesture(2);
    await act(async () => root.unmount());
    useGameStore.setState({ interactionMode: "inspect" });
  });

  it("prioritizes a crop planting gesture over camera movement", async () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    camera.zoom = 40;
    const domElement = document.createElement("div");
    useThreeMock.mockReturnValue({ camera, gl: { domElement } });
    useGameStore.setState({
      game: createInitialGameState(0),
      interactionMode: "farm",
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => root.render(createElement(CameraController)));
    const initialPosition = camera.position.clone();
    const createPointerEvent = (
      type: string,
      clientX: number,
      clientY: number,
    ): PointerEvent => {
      const event = new Event(type) as PointerEvent;
      Object.defineProperties(event, {
        pointerId: { value: 4 },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };

    beginCropGesture(4);
    await act(async () => {
      domElement.dispatchEvent(createPointerEvent("pointerdown", 100, 100));
      domElement.dispatchEvent(createPointerEvent("pointermove", 124, 112));
    });

    expect(camera.position.x).toBe(initialPosition.x);
    expect(camera.position.z).toBe(initialPosition.z);

    endCropGesture(4);
    await act(async () => root.unmount());
    useGameStore.setState({ interactionMode: "inspect" });
  });
});

afterEach(() => {
  endCropGesture(2);
  endCropGesture(4);
  useThreeMock.mockReset();
  document.body.replaceChildren();
});
