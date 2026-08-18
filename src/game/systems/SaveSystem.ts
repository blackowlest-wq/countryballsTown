import { SAVE_KEY } from "../constants/gameConstants";
import { createInitialGameState } from "../core/GameState";
import type { GameState } from "../types/Village";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GameState>;
  return (
    typeof candidate.coins === "number" &&
    typeof candidate.villageLevel === "number" &&
    Array.isArray(candidate.residents) &&
    Array.isArray(candidate.buildings) &&
    Array.isArray(candidate.unlockedCountries) &&
    Array.isArray(candidate.unlockedBuildings)
  );
}

function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined" || !window.localStorage) return undefined;
  return window.localStorage;
}

export function saveGameState(
  state: GameState,
  storage: StorageLike | undefined = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
  } catch {
    // Saving is best-effort: a private browsing quota error should not stop the game.
  }
}

export function loadGameState(
  storage: StorageLike | undefined = getBrowserStorage(),
  now = Date.now(),
): GameState {
  if (!storage) return createInitialGameState(now);
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState(now);
    const parsed: unknown = JSON.parse(raw);
    if (!isGameState(parsed)) return createInitialGameState(now);
    return { ...parsed, lastSavedAt: parsed.lastSavedAt || now };
  } catch {
    return createInitialGameState(now);
  }
}
