export const VILLAGE_BGM_SOURCE = "/audio/kaerimichi_no_ramune.mp3";
const VILLAGE_BGM_VOLUME = 0.36;

function createAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio !== "function") return null;

  try {
    const audio = new window.Audio(VILLAGE_BGM_SOURCE);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VILLAGE_BGM_VOLUME;
    return audio;
  } catch {
    return null;
  }
}

export class VillageBgm {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private disposed = false;

  public async start(): Promise<boolean> {
    if (this.disposed) return false;

    const audio = this.audio ?? createAudioElement();
    if (!audio) return false;
    this.audio = audio;

    if (this.playing) return true;

    try {
      await audio.play();
    } catch {
      return false;
    }

    this.playing = true;
    return true;
  }

  public stop(): void {
    this.playing = false;
    if (!this.audio) return;

    this.audio.pause();
    try {
      this.audio.currentTime = 0;
    } catch {
      // 読み込み前など、再生位置を変更できないブラウザがあります。
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.audio = null;
  }
}
