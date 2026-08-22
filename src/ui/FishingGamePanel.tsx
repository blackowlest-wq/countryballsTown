import { useCallback, useEffect, useState } from "react";
import { fishDefinitions } from "../game/data/fish";
import {
  advanceFishingGauge,
  chooseFishDefinition,
  createFishingGaugeTarget,
  isFishingGaugeInTarget,
  type FishDefinition,
  type FishingGaugeState,
  type FishingGaugeTarget,
} from "../game/systems/FishGameSystem";
import { useGameStore } from "../store/gameStore";

type FishingPhase = "waiting" | "bite" | "gauge" | "caught" | "escaped";

const FIRST_BITE_DELAY_MIN_MS = 1_200;
const FIRST_BITE_DELAY_RANGE_MS = 1_800;

function createGaugeState(): FishingGaugeState {
  return { position: 0, direction: 1 };
}

function getPhaseMessage(phase: FishingPhase): string {
  switch (phase) {
    case "waiting":
      return "波の音を聞きながら、浮きが動くのを待ちましょう。";
    case "bite":
      return "魚が食いつきました！すぐにタップ！";
    case "gauge":
      return "動くマークを魚のいる範囲で止めましょう。";
    case "caught":
      return "魚を釣り上げました！";
    case "escaped":
      return "魚に逃げられてしまいました。";
  }
}

export function FishingGamePanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isFishingGameOpen);
  const close = useGameStore((store) => store.closeFishingGame);
  const recordFishCatch = useGameStore((store) => store.recordFishCatch);
  const [phase, setPhase] = useState<FishingPhase>("waiting");
  const [fish, setFish] = useState<FishDefinition>(() => chooseFishDefinition(fishDefinitions));
  const [target, setTarget] = useState<FishingGaugeTarget>(() => createFishingGaugeTarget(fish));
  const [gauge, setGauge] = useState<FishingGaugeState>(createGaugeState);

  const startRound = useCallback(() => {
    const nextFish = chooseFishDefinition(fishDefinitions);
    setFish(nextFish);
    setTarget(createFishingGaugeTarget(nextFish));
    setGauge(createGaugeState());
    setPhase("waiting");
  }, []);

  useEffect(() => {
    if (open) startRound();
  }, [open, startRound]);

  useEffect(() => {
    if (!open || phase !== "waiting") return;
    const timer = window.setTimeout(
      () => setPhase("bite"),
      FIRST_BITE_DELAY_MIN_MS + Math.random() * FIRST_BITE_DELAY_RANGE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, phase]);

  useEffect(() => {
    if (!open || phase !== "bite") return;
    const timer = window.setTimeout(() => setPhase("escaped"), fish.biteWindowMs);
    return () => window.clearTimeout(timer);
  }, [fish.biteWindowMs, open, phase]);

  useEffect(() => {
    if (!open || phase !== "gauge") return;
    const timer = window.setInterval(() => {
      setGauge((current) => advanceFishingGauge(current, 16, fish.gaugeSpeed));
    }, 16);
    return () => window.clearInterval(timer);
  }, [fish.gaugeSpeed, open, phase]);

  if (!open) return null;

  const handleBite = (): void => {
    if (phase === "bite") setPhase("gauge");
  };

  const handleStopGauge = (): void => {
    if (phase !== "gauge") return;
    if (isFishingGaugeInTarget(gauge.position, target)) {
      recordFishCatch(fish.type);
      setPhase("caught");
    } else {
      setPhase("escaped");
    }
  };

  const markerPosition = `${gauge.position * 100}%`;
  const targetStart = `${target.start * 100}%`;
  const targetWidth = `${(target.end - target.start) * 100}%`;

  return (
    <div className="fishing-overlay">
      <section className={`fishing-modal fishing-game-panel fishing-phase-${phase}`} role="dialog" aria-modal="true" aria-label="海の魚釣りゲーム">
        <div className="panel-heading compact-heading">
          <div>
            <p className="eyebrow">SEA FISHING</p>
            <h2>海の魚釣り</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} aria-label="釣りをやめる">×</button>
        </div>

        <div className="fishing-stage" aria-live="polite">
          <div className="fishing-cloud fishing-cloud-left" aria-hidden="true" />
          <div className="fishing-cloud fishing-cloud-right" aria-hidden="true" />
          <div className="fishing-water-line" aria-hidden="true" />
          <div className="fishing-rod" aria-hidden="true">╲</div>
          <div className="fishing-line" aria-hidden="true" />
          <div className={`fishing-bobber fishing-bobber-${phase}`} aria-hidden={phase !== "bite"}>
            {phase === "bite" ? "!" : "🔴"}
          </div>
          {phase === "bite" && (
            <button className="fishing-bite-button" type="button" onClick={handleBite} aria-label="魚が食いついたのでタップ">
              ！
            </button>
          )}
          {phase === "gauge" && (
            <div className="fishing-gauge-wrap">
              <div className="fishing-gauge" aria-label="魚釣りゲージ">
                <span
                  className="fishing-gauge-target"
                  style={{ left: targetStart, width: targetWidth }}
                />
                <span className="fishing-gauge-marker" style={{ left: markerPosition }} />
              </div>
              <div className="fishing-gauge-direction" aria-hidden="true">↔</div>
              <button className="primary-button fishing-stop-button" type="button" onClick={handleStopGauge}>
                ここで止める
              </button>
            </div>
          )}
        </div>

        <div className="fishing-status-copy">
          <p className="fishing-phase-message">{getPhaseMessage(phase)}</p>
          {phase === "waiting" && <small>しばらくすると魚が食いつきます。</small>}
          {phase === "bite" && <small>魚ごとにタップできる時間が違います。</small>}
          {phase === "gauge" && (
            <small>魚：{fish.name} / 難易度：{fish.rarityLabel}</small>
          )}
          {phase === "caught" && (
            <div className="fishing-result-card">
              <span className="fishing-result-icon" aria-hidden="true">{fish.icon}</span>
              <span><strong>{fish.name}</strong><small>{fish.rarityLabel}の魚をゲット！</small></span>
            </div>
          )}
          {phase === "escaped" && <small>もう一度、桟橋から挑戦できます。</small>}
        </div>

        {(phase === "caught" || phase === "escaped") && (
          <div className="panel-actions fishing-result-actions">
            <button className="primary-button" type="button" onClick={startRound}>もう一度釣る</button>
            <button className="subtle-button" type="button" onClick={close}>閉じる</button>
          </div>
        )}
      </section>
    </div>
  );
}
