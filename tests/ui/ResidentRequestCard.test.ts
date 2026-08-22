import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { residentRequestsById } from "../../src/game/data/residentRequests";
import { useGameStore } from "../../src/store/gameStore";
import { ResidentRequestCard } from "../../src/ui/ResidentRequestCard";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("ResidentRequestCard", () => {
  it("コイン進捗を整数に切り捨てて表示する", async () => {
    const definition = residentRequestsById["italy-festival-savings"];
    const originalRewardCoins = definition.rewardCoins;
    const originalTarget = definition.goal.target;
    definition.rewardCoins = 7.9;
    definition.goal.target = 40.9;
    useGameStore.setState({
      game: {
        ...createInitialGameState(0),
        activeResidentRequest: {
          definitionId: "italy-festival-savings",
          residentId: "resident-test",
          progress: 7.499999999999989,
          startedAt: 0,
        },
      },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => root.render(createElement(ResidentRequestCard)));

      expect(container.textContent).toContain("7/40");
      expect(container.textContent).not.toContain("7.499999999999989/40");
      expect(container.textContent).not.toContain("7.5/40");
      expect(container.textContent).not.toContain("/40.9");
      expect(container.textContent).toContain("✦ +7");
      expect(container.textContent).not.toContain("✦ +7.9");
    } finally {
      await act(async () => root.unmount());
      definition.rewardCoins = originalRewardCoins;
      definition.goal.target = originalTarget;
    }
  });
});
