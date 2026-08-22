import { afterEach, describe, expect, it, vi } from "vitest";
import { VillageBgm, VILLAGE_BGM_SOURCE } from "../../src/audio/VillageBgm";

class FakeAudioElement {
  public readonly src: string;
  public loop = false;
  public preload = "";
  public volume = 1;
  public currentTime = 0;
  public paused = true;
  public playCalls = 0;
  public pauseCalls = 0;

  public constructor(src: string) {
    this.src = src;
  }

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
});

describe("VillageBgm", () => {
  it("指定したMP3をループ再生し、停止時に先頭へ戻す", async () => {
    const audioHolder: { current: FakeAudioElement | null } = { current: null };
    const AudioConstructor = class {
      public constructor(src: string) {
        audioHolder.current = new FakeAudioElement(src);
        return audioHolder.current;
      }
    } as unknown as typeof Audio;

    vi.stubGlobal("window", { Audio: AudioConstructor });

    const bgm = new VillageBgm();
    expect(await bgm.start()).toBe(true);
    const audio = audioHolder.current;
    expect(audio).not.toBeNull();
    if (!audio) throw new Error("Audio element was not created");
    expect(audio.src).toBe(VILLAGE_BGM_SOURCE);
    expect(audio.loop).toBe(true);
    expect(audio.preload).toBe("auto");
    expect(audio.volume).toBeCloseTo(0.36);
    expect(audio.playCalls).toBe(1);

    audio.currentTime = 42;
    bgm.stop();
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(0);
    expect(audio.pauseCalls).toBe(1);
    bgm.dispose();
  });
});
