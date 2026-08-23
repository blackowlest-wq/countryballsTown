import { FISHING_ROD_COST } from "../game/constants/gameConstants";
import { canPurchaseFishingRod } from "../game/systems/FishingSystem";
import { useGameStore } from "../store/gameStore";
import { formatCoinAmount } from "../utils/coinFormatting";

export function FishingPromptPanel(): JSX.Element | null {
  const game = useGameStore((store) => store.game);
  const open = useGameStore((store) => store.isFishingPromptOpen);
  const purchase = useGameStore((store) => store.purchaseFishingRod);
  const start = useGameStore((store) => store.startFishingGame);
  const close = useGameStore((store) => store.closeFishingPrompt);
  const hasFishingRod = game.hasFishingRod;
  const canPurchase = canPurchaseFishingRod(game);

  if (!open) return null;

  return (
    <div
      className="fishing-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="fishing-modal fishing-prompt-panel" role="dialog" aria-modal="true" aria-label="海の魚釣り">
        <div className="panel-heading compact-heading">
          <div>
            <p className="eyebrow">FISHING</p>
            <h2>海の魚釣り</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} aria-label="釣りを閉じる">×</button>
        </div>
        <div className="fishing-prompt-art" aria-hidden="true">🎣🌊</div>
        <p className="fishing-prompt-copy">
          {hasFishingRod ? "海の魚釣りをやりますか？" : "釣り竿を買うと、海で魚釣りをプレイできます。"}
        </p>
        {!hasFishingRod && (
          <div className="fishing-rod-offer">
            <span>🎣 釣り竿</span>
            <strong><span className="tiny-coin">✦</span>{formatCoinAmount(FISHING_ROD_COST)}</strong>
          </div>
        )}
        <p className="fishing-prompt-hint">
          {hasFishingRod
            ? "浮きが沈んだら、びっくりマークをすぐにタップしましょう。"
            : canPurchase
              ? "購入後、すぐに釣りを始められます。"
              : "コインを1,000枚集めると購入できます。"}
        </p>
        <div className="panel-actions">
          {hasFishingRod ? (
            <button className="primary-button" type="button" onClick={start}>釣りを始める</button>
          ) : (
            <button className="primary-button" type="button" onClick={purchase} disabled={!canPurchase}>
              釣り竿を買う
            </button>
          )}
          <button className="subtle-button" type="button" onClick={close}>やめる</button>
        </div>
      </section>
    </div>
  );
}
