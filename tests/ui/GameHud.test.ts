import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { GameHud } from "../../src/ui/GameHud";
import { withInventory } from "../inventoryFixture";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  useGameStore.setState({ game: createInitialGameState(0), notice: null });
  document.body.replaceChildren();
});

describe("GameHud", () => {
  it("右上に魚の合計数を表示しない", async () => {
    useGameStore.setState({
      game: withInventory(createInitialGameState(0), {
        sardine: 2,
        mackerel: 1,
        "sea-bream": 1,
        tuna: 3,
      }),
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(GameHud)));

    expect(container.querySelector(".fish-resource-pill")).toBeNull();
    expect(container.querySelector(".hud-right")?.textContent).not.toContain("魚");
    await act(async () => root.unmount());
  });

  it("設定ボタンを表示し、BGM切り替えを設定パネルへまとめる", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(GameHud)));

    const launcher = container.querySelector(".settings-launcher");
    expect(launcher?.getAttribute("aria-label")).toBe("設定を開く");
    expect(launcher?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector(".hud-right .bgm-toggle")).toBeNull();
    expect(container.querySelector(".settings-panel .bgm-toggle")).not.toBeNull();
    expect((container.querySelector(".settings-overlay") as HTMLElement).hidden).toBe(true);

    await act(async () => {
      (launcher as HTMLButtonElement).click();
    });

    expect(launcher?.getAttribute("aria-expanded")).toBe("true");
    expect((container.querySelector(".settings-overlay") as HTMLElement).hidden).toBe(false);

    await act(async () => root.unmount());
  });
});
