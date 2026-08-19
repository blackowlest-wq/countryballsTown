const BPM = 78;
const STEP_DURATION_SECONDS = 60 / BPM / 2;
const LOOKAHEAD_SECONDS = 0.35;
const SCHEDULER_INTERVAL_MS = 100;

const NOTE_FREQUENCIES: Record<string, number> = {
  A2: 110,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.26,
  F5: 698.46,
  G5: 783.99,
  A5: 880,
};

const MELODY: readonly (string | null)[] = [
  "C5", null, "E5", null, "G5", null, "E5", null,
  "D5", null, "C5", null, "A4", null, "G4", null,
  "A4", null, "C5", null, "E5", null, "D5", null,
  "C5", null, "G4", null, "A4", null, "C5", null,
  "E5", null, "G5", null, "A5", null, "G5", null,
  "E5", null, "D5", null, "C5", null, "D5", null,
  "E5", null, "D5", null, "C5", null, "A4", null,
  "G4", null, "A4", null, "C5", null, "C5", null,
];

const CHORDS: readonly (readonly string[])[] = [
  ["C3", "G3", "E4"],
  ["A2", "E3", "C4"],
  ["F3", "C4", "A4"],
  ["G3", "D4", "B4"],
];

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const audioContextConstructor =
    window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
  if (!audioContextConstructor) return null;

  try {
    return new audioContextConstructor();
  } catch {
    return null;
  }
}

export class VillageBgm {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private sequenceIndex = 0;
  private playing = false;
  private disposed = false;

  public async start(): Promise<boolean> {
    if (this.disposed) return false;

    const context = this.context ?? createAudioContext();
    if (!context) return false;
    this.context = context;

    try {
      if (context.state === "suspended") await context.resume();
    } catch {
      return false;
    }

    if (context.state === "closed") return false;
    if (this.playing) return true;

    this.masterGain ??= this.createMasterGain(context);
    const now = context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.36, now + 0.35);
    this.nextNoteTime = now + 0.08;
    this.sequenceIndex = 0;
    this.playing = true;
    this.schedulerId = window.setInterval(() => this.scheduleNotes(), SCHEDULER_INTERVAL_MS);
    this.scheduleNotes();
    return true;
  }

  public stop(): void {
    this.playing = false;
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    const context = this.context;
    this.context = null;
    this.masterGain = null;
    if (context) void context.close();
  }

  private createMasterGain(context: AudioContext): GainNode {
    const masterGain = context.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(context.destination);
    return masterGain;
  }

  private scheduleNotes(): void {
    if (!this.playing || !this.context || !this.masterGain) return;

    while (this.nextNoteTime < this.context.currentTime + LOOKAHEAD_SECONDS) {
      const stepIndex = this.sequenceIndex % MELODY.length;
      const stepDuration = STEP_DURATION_SECONDS;

      if (stepIndex % 16 === 0) {
        const chord = CHORDS[Math.floor(stepIndex / 16) % CHORDS.length];
        this.scheduleChord(chord, this.nextNoteTime, stepDuration * 16);
      }

      const note = MELODY[stepIndex];
      if (note) this.scheduleMelodyNote(note, this.nextNoteTime, stepDuration * 0.9);

      this.nextNoteTime += stepDuration;
      this.sequenceIndex += 1;
    }
  }

  private scheduleChord(chord: readonly string[], startTime: number, duration: number): void {
    for (const note of chord) {
      this.scheduleTone(note, startTime, duration, "sine", 0.025, 0.25, 0.5);
    }
  }

  private scheduleMelodyNote(note: string, startTime: number, duration: number): void {
    this.scheduleTone(note, startTime, duration, "triangle", 0.11, 0.045, 0.18);
  }

  private scheduleTone(
    note: string,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    attack: number,
    release: number,
  ): void {
    if (!this.context || !this.masterGain) return;
    const frequency = NOTE_FREQUENCIES[note];
    if (!frequency) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const releaseStart = Math.max(startTime + attack, startTime + duration - release);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + attack);
    gain.gain.setValueAtTime(volume, releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }
}
