import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { MAX_COINS } from "../../src/game/constants/gameConstants";
import { advanceEconomy, creditCoins } from "../../src/game/systems/EconomySystem";

describe("EconomySystem", () => {
  it("時間経過1秒ごとにコインを付与する", () => {
    const result = advanceEconomy(createInitialGameState(0), 1_000);
    expect(result.state.coins).toBe(100.1);
    expect(result.remainderMs).toBe(0);
  });

  it("10秒で1コインを付与する", () => {
    const result = advanceEconomy(createInitialGameState(0), 10_000);
    expect(result.state.coins).toBe(101);
    expect(result.coinsEarned).toBe(1);
  });

  it("3秒で0.3コインを付与し、小数を正規化する", () => {
    const result = advanceEconomy(createInitialGameState(0), 3_000);
    expect(result.state.coins).toBe(100.3);
    expect(result.coinsEarned).toBe(0.3);
  });

  it("端数時間を次のtickへ持ち越す", () => {
    const first = advanceEconomy(createInitialGameState(0), 600);
    const second = advanceEconomy(first.state, 400, first.remainderMs);
    expect(first.state.coins).toBe(100);
    expect(second.state.coins).toBe(100.1);
  });

  it("所持コイン上限を超える時間経過分は差額だけ付与する", () => {
    const state = { ...createInitialGameState(0), coins: MAX_COINS - 0.1 };

    const result = advanceEconomy(state, 2_000);

    expect(result.state.coins).toBe(MAX_COINS);
    expect(result.coinsEarned).toBe(0.1);
  });

  it("上限到達後のコイン付与は状態を増やさない", () => {
    const state = { ...createInitialGameState(0), coins: MAX_COINS };

    const result = creditCoins(state, 12);

    expect(result.state).toBe(state);
    expect(result.coinsEarned).toBe(0);
  });
});
