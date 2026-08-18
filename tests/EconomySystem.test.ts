import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/game/core/GameState";
import { advanceEconomy } from "../src/game/systems/EconomySystem";

describe("EconomySystem", () => {
  it("時間経過10秒ごとにコインを付与する", () => {
    const result = advanceEconomy(createInitialGameState(0), 10_000);
    expect(result.state.coins).toBe(101);
    expect(result.remainderMs).toBe(0);
  });

  it("端数時間を次のtickへ持ち越す", () => {
    const first = advanceEconomy(createInitialGameState(0), 6_000);
    const second = advanceEconomy(first.state, 4_000, first.remainderMs);
    expect(first.state.coins).toBe(100);
    expect(second.state.coins).toBe(101);
  });
});
