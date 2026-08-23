import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BgmToggle } from "../../src/ui/BgmToggle";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

class FakeAudioElement {
  public currentTime = 0;
  public paused = true;
  public playCalls = 0;
  public pauseCalls = 0;

  public async play(): Promise<void> {
    this.paused = false;
    this.playCalls += 1;
  }

  public pause(): void {
    this.paused = true;
    this.pauseCalls += 1;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.replaceChildren();
});

describe("BgmToggle", () => {
  it("pagehide時に再生中のBGMを停止する", async () => {
    const audioHolder: { current: FakeAudioElement | null } = { current: null };
    const AudioConstructor = class {
      public constructor() {
        audioHolder.current = new FakeAudioElement();
        return audioHolder.current;
      }
    } as unknown as typeof Audio;
    vi.stubGlobal("Audio", AudioConstructor);

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(BgmToggle)));
    await act(async () => {
      window.dispatchEvent(new Event("pointerdown"));
      await Promise.resolve();
    });

    const audio = audioHolder.current;
    expect(audio?.paused).toBe(false);
    if (!audio) throw new Error("Audio element was not created");

    audio.currentTime = 42;
    window.dispatchEvent(new Event("pagehide"));

    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(0);
    expect(audio.pauseCalls).toBe(1);
    await act(async () => root.unmount());
  });
});
