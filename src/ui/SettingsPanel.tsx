import { useEffect, useRef, useState } from "react";
import { MAX_COINS } from "../game/constants/gameConstants";
import { useGameStore } from "../store/gameStore";
import { formatCoinAmount } from "../utils/coinFormatting";
import { BgmToggle } from "./BgmToggle";
import { PwaInstallStatus, usePwaInstall } from "./usePwaInstall";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps): JSX.Element {
  const resetGame = useGameStore((store) => store.resetGame);
  const grantMaxCoins = useGameStore((store) => store.grantMaxCoinsForDevelopment);
  const { canInstall, install, isInstalled, isPrompting, status } = usePwaInstall();
  const [isResetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) setResetConfirmationOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  const confirmReset = (): void => {
    resetGame();
    setResetConfirmationOpen(false);
    onClose();
  };

  const installDescription = getInstallDescription(status);
  const installButtonLabel = isInstalled
    ? "インストール済み"
    : isPrompting
      ? "追加中…"
      : "アプリをダウンロード";

  return (
    <div
      className="settings-overlay"
      hidden={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <section
        id="settings-panel"
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="設定"
      >
        <div className="panel-heading compact-heading">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h2>設定</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="設定を閉じる"
          >
            ×
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-section-copy">
            <strong>BGM</strong>
            <small>村で流れる音楽を切り替えます。</small>
          </div>
          <BgmToggle />
        </div>

        <div className="settings-section settings-install-section">
          <div className="settings-section-copy">
            <strong>アプリをダウンロード</strong>
            <small>{installDescription}</small>
          </div>
          <button
            className="subtle-button settings-install-button"
            data-action="install-app"
            type="button"
            disabled={!canInstall || isPrompting || isInstalled}
            onClick={() => { void install(); }}
          >
            {installButtonLabel}
          </button>
        </div>

        <div className="settings-section settings-debug-section">
          <div className="settings-section-copy">
            <strong>デバッグ</strong>
            <small>所持コインを上限の{formatCoinAmount(MAX_COINS)}にします。</small>
          </div>
          <button
            className="subtle-button settings-debug-button"
            data-action="grant-max-coins"
            type="button"
            onClick={grantMaxCoins}
          >
            コインを上限まで付与
          </button>
        </div>

        <div className="settings-danger-zone">
          <div className="settings-section-copy">
            <strong>ゲーム状況のリセット</strong>
            <small>村、建物、在庫、コインなどを最初の状態へ戻します。</small>
          </div>
          {!isResetConfirmationOpen ? (
            <button
              className="danger-button"
              data-action="request-game-reset"
              type="button"
              onClick={() => setResetConfirmationOpen(true)}
            >
              リセット
            </button>
          ) : (
            <div className="settings-reset-confirmation" role="alert">
              <p>保存済みのゲーム状況も上書きされます。本当にリセットしますか？</p>
              <div>
                <button
                  className="subtle-button"
                  type="button"
                  onClick={() => setResetConfirmationOpen(false)}
                >
                  キャンセル
                </button>
                <button
                  className="danger-button"
                  data-action="confirm-game-reset"
                  type="button"
                  onClick={confirmReset}
                >
                  リセットを実行
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getInstallDescription(status: PwaInstallStatus): string {
  switch (status) {
    case "installed":
      return "この端末にはインストール済みです。";
    case "available":
      return "このブラウザからアプリとして追加できます。";
    case "prompting":
      return "インストール画面を開いています。";
    case "awaiting-install":
      return "インストール処理を確認しています。追加されない場合は再読み込み後にもう一度お試しください。";
    case "dismissed":
      return "インストールはキャンセルされました。再読み込み後にもう一度お試しください。";
    case "unavailable":
      return "インストール候補が利用できません。再読み込み後にもう一度お試しください。";
  }
}
