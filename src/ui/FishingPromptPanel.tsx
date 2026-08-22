import { useGameStore } from "../store/gameStore";

export function FishingPromptPanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isFishingPromptOpen);
  const start = useGameStore((store) => store.startFishingGame);
  const close = useGameStore((store) => store.closeFishingPrompt);

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
        <p className="fishing-prompt-copy">海の魚釣りをやりますか？</p>
        <p className="fishing-prompt-hint">浮きが沈んだら、びっくりマークをすぐにタップしましょう。</p>
        <div className="panel-actions">
          <button className="primary-button" type="button" onClick={start}>釣りを始める</button>
          <button className="subtle-button" type="button" onClick={close}>やめる</button>
        </div>
      </section>
    </div>
  );
}
