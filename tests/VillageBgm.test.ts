import { afterEach, describe, expect, it, vi } from "vitest";
import { VillageBgm } from "../src/audio/VillageBgm";

class FakeAudioParam {
  public value = 0;
  public readonly rampTargets: number[] = [];

  public cancelScheduledValues(_startTime: number): void {}

  public setValueAtTime(value: number, _startTime: number): void {
    this.value = value;
  }

  public exponentialRampToValueAtTime(value: number, _endTime: number): void {
    this.value = value;
    this.rampTargets.push(value);
  }
}

class FakeGainNode {
  public readonly gain = new FakeAudioParam();

  public connect(_destination: unknown): void {}
}

class FakeOscillatorNode {
  public type: OscillatorType = "sine";
  public readonly frequency = new FakeAudioParam();

  public connect(_destination: unknown): void {}
  public start(_when: number): void {}
  public stop(_when: number): void {}
}

class FakeAudioContext {
  public readonly currentTime = 0;
  public readonly destination = {};
  public readonly gains: FakeGainNode[] = [];
  public state: AudioContextState = "running";

  public createGain(): FakeGainNode {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  public createOscillator(): FakeOscillatorNode {
    return new FakeOscillatorNode();
  }

  public async resume(): Promise<void> {
    this.state = "running";
  }

  public async close(): Promise<void> {
    this.state = "closed";
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VillageBgm", () => {
  it("開始時にマスター音量を従来の約2倍へ上げる", async () => {
    const context = new FakeAudioContext();
    const AudioContextConstructor = class {
      public constructor() {
        return context;
      }
    } as unknown as typeof AudioContext;

    vi.stubGlobal("window", {
      AudioContext: AudioContextConstructor,
      setInterval: vi.fn(() => 1),
      clearInterval: vi.fn(),
    });

    const bgm = new VillageBgm();
    expect(await bgm.start()).toBe(true);
    expect(context.gains[0]?.gain.rampTargets).toContain(0.36);
    bgm.dispose();
  });
});
