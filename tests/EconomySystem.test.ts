import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { advanceEconomy } from "../src/game/systems/EconomySystem";

describe("EconomySystem", () => {
  it("時間経過1秒ごとにコインを付与する", () => {
    const result = advanceEconomy(createInitialGameState(0), 1_000);
    expect(result.state.coins).toBe(101);
    expect(result.remainderMs).toBe(0);
  });

  it("10秒で10コインを付与する", () => {
    const result = advanceEconomy(createInitialGameState(0), 10_000);
    expect(result.state.coins).toBe(110);
    expect(result.coinsEarned).toBe(10);
  });

  it("端数時間を次のtickへ持ち越す", () => {
    const first = advanceEconomy(createInitialGameState(0), 600);
    const second = advanceEconomy(first.state, 400, first.remainderMs);
    expect(first.state.coins).toBe(100);
    expect(second.state.coins).toBe(101);
  });
});
