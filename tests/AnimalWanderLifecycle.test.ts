// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Group } from "three";
import { useAnimalWander } from "../src/scene/buildings/animalWander";

type FrameState = { clock: { elapsedTime: number } };
type FrameCallback = (state: FrameState) => void;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { frameCallbacks } = vi.hoisted(() => ({
  frameCallbacks: [] as FrameCallback[],
}));

vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: FrameCallback) => {
    frameCallbacks.push(callback);
  },
}));

function AnimalWanderProbe({ group }: { group: { current: Group | null } }): null {
  useAnimalWander(group, "cow-lifecycle", { x: 0, z: 0 });
  return null;
}

describe("animal wandering lifecycle", () => {
  afterEach(() => {
    frameCallbacks.length = 0;
    document.body.replaceChildren();
  });

  it("does not advance while the app is closed and then resumes from active time", async () => {
    const group = {
      current: {
        position: { x: 0, z: 0 },
        rotation: { y: 0 },
      },
    } as unknown as { current: Group | null };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AnimalWanderProbe, { group }));
    });
    const frame = frameCallbacks[0];
    if (!frame) throw new Error("Animal wander frame callback was not registered");

    await act(async () => frame({ clock: { elapsedTime: 0 } }));
    await act(async () => frame({ clock: { elapsedTime: 2 } }));
    const positionBeforeClose = {
      x: group.current?.position.x,
      z: group.current?.position.z,
    };

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      frame({ clock: { elapsedTime: 3_600 } });
    });

    expect(group.current?.position).toEqual(positionBeforeClose);

    await act(async () => {
      window.dispatchEvent(new Event("pageshow"));
      frame({ clock: { elapsedTime: 3_600 } });
    });
    expect(group.current?.position).toEqual(positionBeforeClose);

    await act(async () => root.unmount());
  });
});
