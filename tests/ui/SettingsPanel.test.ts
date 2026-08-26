import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_COINS } from "../../src/game/constants/gameConstants";
import { createInitialGameState } from "../../src/game/core/GameState";
import { useGameStore } from "../../src/store/gameStore";
import { SettingsPanel } from "../../src/ui/SettingsPanel";
import type { BeforeInstallPromptEvent } from "../../src/ui/usePwaInstall";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

class FakeAudioElement {
  public currentTime = 0;
  public loop = false;
  public preload = "";
  public volume = 1;

  public async play(): Promise<void> {
    // The settings test only needs the browser audio seam to be available.
  }

  public pause(): void {
    // The settings test only needs the browser audio seam to be available.
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  useGameStore.setState({
    game: createInitialGameState(0),
    interactionMode: "inspect",
    selectedBuildingId: null,
    notice: null,
  });
  document.body.replaceChildren();
});

describe("SettingsPanel", () => {
  it("BGMを設定内に表示し、デバッグ付与と確認付きリセットを操作できる", async () => {
    vi.stubGlobal("Audio", class {
      public constructor() {
        return new FakeAudioElement();
      }
    } as unknown as typeof Audio);
    vi.spyOn(Date, "now").mockReturnValue(50_000);
    useGameStore.setState({
      game: { ...createInitialGameState(0), coins: 321, villageLevel: 2 },
    });
    const onClose = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose })));

    expect(container.querySelector(".settings-panel .bgm-toggle")).not.toBeNull();
    const installButton = container.querySelector("[data-action='install-app']") as HTMLButtonElement;
    expect(installButton).not.toBeNull();
    expect(installButton.disabled).toBe(true);
    expect(container.textContent).toContain("インストール候補が利用できません");
    expect(container.querySelector("[data-action='grant-max-coins']")).not.toBeNull();
    expect(container.textContent).toContain("上限の10,000");

    await act(async () => {
      (container.querySelector("[data-action='grant-max-coins']") as HTMLButtonElement).click();
    });
    expect(useGameStore.getState().game.coins).toBe(MAX_COINS);

    await act(async () => {
      (container.querySelector("[data-action='request-game-reset']") as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain("本当にリセットしますか？");
    expect(useGameStore.getState().game.coins).toBe(MAX_COINS);

    await act(async () => {
      (container.querySelector("[data-action='confirm-game-reset']") as HTMLButtonElement).click();
    });
    expect(useGameStore.getState().game.coins).toBe(100);
    expect(onClose).toHaveBeenCalledOnce();

    await act(async () => root.unmount());
  });

  it("beforeinstallpromptを設定から実行し、インストール完了後は状態を表示する", async () => {
    vi.stubGlobal("Audio", class {
      public constructor() {
        return new FakeAudioElement();
      }
    } as unknown as typeof Audio);
    let resolveUserChoice: ((choice: { outcome: "accepted"; platform: string }) => void) | undefined;
    const userChoice = new Promise<{ outcome: "accepted"; platform: string }>((resolve) => {
      resolveUserChoice = resolve;
    });
    const prompt = vi.fn(() => Promise.resolve());
    const beforeInstallPrompt = new Event("beforeinstallprompt", { cancelable: true }) as BeforeInstallPromptEvent;
    Object.defineProperties(beforeInstallPrompt, {
      prompt: { configurable: true, value: prompt },
      userChoice: { configurable: true, value: userChoice },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose: vi.fn() })));

    await act(async () => {
      window.dispatchEvent(beforeInstallPrompt);
    });
    const installButton = container.querySelector("[data-action='install-app']") as HTMLButtonElement;
    expect(beforeInstallPrompt.defaultPrevented).toBe(true);
    expect(installButton.disabled).toBe(false);
    expect(container.textContent).toContain("このブラウザからアプリとして追加できます");

    await act(async () => {
      installButton.click();
    });
    expect(prompt).toHaveBeenCalledOnce();
    expect(installButton.disabled).toBe(true);
    expect(container.textContent).toContain("追加中…");

    resolveUserChoice?.({ outcome: "accepted", platform: "webapp" });
    await act(async () => {
      await userChoice;
    });
    expect(container.textContent).toContain("インストール処理を確認しています");
    expect(container.textContent).not.toContain("この端末にはインストール済みです");

    await act(async () => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(container.textContent).toContain("この端末にはインストール済みです");
    expect(installButton.textContent).toContain("インストール済み");

    await act(async () => root.unmount());
  });

  it("インストールをキャンセルすると追加中表示から戻り、再試行の案内を表示する", async () => {
    vi.stubGlobal("Audio", class {
      public constructor() {
        return new FakeAudioElement();
      }
    } as unknown as typeof Audio);
    const prompt = vi.fn(() => Promise.resolve());
    const beforeInstallPrompt = new Event("beforeinstallprompt", { cancelable: true }) as BeforeInstallPromptEvent;
    Object.defineProperties(beforeInstallPrompt, {
      prompt: { configurable: true, value: prompt },
      userChoice: {
        configurable: true,
        value: Promise.resolve({ outcome: "dismissed" as const, platform: "webapp" }),
      },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose: vi.fn() })));

    await act(async () => window.dispatchEvent(beforeInstallPrompt));
    const installButton = container.querySelector("[data-action='install-app']") as HTMLButtonElement;
    await act(async () => installButton.click());

    expect(prompt).toHaveBeenCalledOnce();
    expect(installButton.disabled).toBe(true);
    expect(container.textContent).not.toContain("追加中…");
    expect(container.textContent).toContain("インストールはキャンセルされました");
    expect(container.textContent).toContain("再読み込み後にもう一度お試しください");

    await act(async () => root.unmount());
  });

  it("プロンプトが例外になっても追加中表示から戻り、再試行の案内を表示する", async () => {
    vi.stubGlobal("Audio", class {
      public constructor() {
        return new FakeAudioElement();
      }
    } as unknown as typeof Audio);
    const prompt = vi.fn(() => {
      throw new Error("installation prompt is unavailable");
    });
    const beforeInstallPrompt = new Event("beforeinstallprompt", { cancelable: true }) as BeforeInstallPromptEvent;
    Object.defineProperties(beforeInstallPrompt, {
      prompt: { configurable: true, value: prompt },
      userChoice: {
        configurable: true,
        value: Promise.resolve({ outcome: "accepted" as const, platform: "webapp" }),
      },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose: vi.fn() })));

    await act(async () => window.dispatchEvent(beforeInstallPrompt));
    const installButton = container.querySelector("[data-action='install-app']") as HTMLButtonElement;
    await act(async () => installButton.click());

    expect(prompt).toHaveBeenCalledOnce();
    expect(installButton.disabled).toBe(true);
    expect(container.textContent).not.toContain("追加中…");
    expect(container.textContent).toContain("インストール候補が利用できません");
    expect(container.textContent).toContain("再読み込み後にもう一度お試しください");

    await act(async () => root.unmount());
  });

  it("standalone表示中はインストール済みとしてボタンを無効にする", async () => {
    vi.stubGlobal("Audio", class {
      public constructor() {
        return new FakeAudioElement();
      }
    } as unknown as typeof Audio);
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose: vi.fn() })));

    const installButton = container.querySelector("[data-action='install-app']") as HTMLButtonElement;
    expect(installButton.disabled).toBe(true);
    expect(installButton.textContent).toContain("インストール済み");
    expect(container.textContent).toContain("この端末にはインストール済みです");

    await act(async () => root.unmount());
  });

  it("Escapeと背景クリックで閉じ、閉じる前のフォーカスを復帰する", async () => {
    vi.stubGlobal("Audio", class {
      public constructor() {
        return new FakeAudioElement();
      }
    } as unknown as typeof Audio);
    const launcher = document.createElement("button");
    launcher.textContent = "設定";
    document.body.append(launcher);
    launcher.focus();
    const onClose = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose })));
    expect(document.activeElement?.getAttribute("aria-label")).toBe("設定を閉じる");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(onClose).toHaveBeenCalledOnce();

    await act(async () => root.render(createElement(SettingsPanel, { open: false, onClose })));
    expect(document.activeElement).toBe(launcher);

    await act(async () => root.render(createElement(SettingsPanel, { open: true, onClose })));
    const overlay = container.querySelector(".settings-overlay") as HTMLDivElement;
    await act(async () => {
      overlay.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);

    await act(async () => root.unmount());
  });
});
