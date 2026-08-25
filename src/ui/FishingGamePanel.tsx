import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { fishDefinitions } from "../game/data/fish";
import {
  advanceFishingChase,
  chooseFishDefinition,
  createFishingChaseState,
  isFishingFishInFrame,
  moveFishingFrameToTap,
  type FishDefinition,
  type FishingChaseState,
  type FishingPoint,
} from "../game/systems/FishGameSystem";
import { useGameStore } from "../store/gameStore";
import { FishIcon } from "./FishIcon";

type FishingPhase = "waiting" | "bite" | "chase" | "caught" | "escaped";

const FIRST_BITE_DELAY_MIN_MS = 1_200;
const FIRST_BITE_DELAY_RANGE_MS = 1_800;

interface FishingRound {
  fish: FishDefinition;
  chase: FishingChaseState;
}

function createFishingRound(): FishingRound {
  const fish = chooseFishDefinition(fishDefinitions);
  return { fish, chase: createFishingChaseState(fish) };
}

function getPhaseMessage(phase: FishingPhase): string {
  switch (phase) {
    case "waiting":
      return "波の音を聞きながら、浮きが動くのを待ちましょう。";
    case "bite":
      return "魚が食いつきました！すぐにタップ！";
    case "chase":
      return "枠の中に魚を入れ続けよう！";
    case "caught":
      return "魚を釣り上げました！";
    case "escaped":
      return "時間切れ！魚に逃げられてしまいました。";
  }
}

export function FishingGamePanel(): JSX.Element | null {
  const open = useGameStore((store) => store.isFishingGameOpen);
  const close = useGameStore((store) => store.closeFishingGame);
  const recordFishCatch = useGameStore((store) => store.recordFishCatch);
  const [phase, setPhase] = useState<FishingPhase>("waiting");
  const [round, setRound] = useState<FishingRound>(createFishingRound);
  const chaseRef = useRef<FishingChaseState>(round.chase);
  const chaseUpdatedAtRef = useRef<number | null>(null);
  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activeTouchRef = useRef(false);
  const resolvedRoundRef = useRef(false);

  const startRound = useCallback(() => {
    const nextRound = createFishingRound();
    chaseRef.current = nextRound.chase;
    chaseUpdatedAtRef.current = null;
    playfieldRef.current = null;
    activePointerIdRef.current = null;
    activeTouchRef.current = false;
    resolvedRoundRef.current = false;
    setRound(nextRound);
    setPhase("waiting");
  }, []);

  useEffect(() => {
    if (open) startRound();
  }, [open, startRound]);

  const fish = round.fish;
  const chase = round.chase;

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
    if (!open || phase !== "chase") return;
    chaseUpdatedAtRef.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const previous = chaseUpdatedAtRef.current ?? now;
      const update = advanceFishingChase(
        chaseRef.current,
        fish,
        now - previous,
        Math.random,
      );
      chaseRef.current = update.state;
      chaseUpdatedAtRef.current = now;
      setRound((current) => ({ ...current, chase: update.state }));
      if (update.caught && !resolvedRoundRef.current) {
        resolvedRoundRef.current = true;
        recordFishCatch(fish.type);
        setPhase("caught");
      } else if (update.timedOut && !resolvedRoundRef.current) {
        resolvedRoundRef.current = true;
        setPhase("escaped");
      }
    }, 16);
    return () => window.clearInterval(timer);
  }, [fish, open, phase, recordFishCatch]);

  const moveFrame = useCallback((tapPosition: FishingPoint): void => {
    const nextFrame = moveFishingFrameToTap(
      chaseRef.current.frame,
      tapPosition,
      fish.catchFrameSize,
    );
    const nextChase = { ...chaseRef.current, frame: nextFrame };
    chaseRef.current = nextChase;
    setRound((current) => ({ ...current, chase: nextChase }));
  }, [fish.catchFrameSize]);

  const getPlayfieldPoint = useCallback((clientX: number, clientY: number): FishingPoint | null => {
    const playfield = playfieldRef.current;
    if (!playfield) return null;
    const bounds = playfield.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    return {
      x: (clientX - bounds.left) / bounds.width,
      y: (clientY - bounds.top) / bounds.height,
    };
  }, []);

  const releasePointer = useCallback((pointerId: number): void => {
    if (activePointerIdRef.current !== pointerId) return;
    activePointerIdRef.current = null;
    const playfield = playfieldRef.current;
    const releasePointerCapture = playfield?.releasePointerCapture;
    if (playfield && typeof releasePointerCapture === "function") {
      try {
        releasePointerCapture.call(playfield, pointerId);
      } catch {
        // ポインターが先に解放されたブラウザではキャプチャ解除が例外になるため無視する。
      }
    }
  }, []);

  useEffect(() => {
    if (!open || phase !== "chase") return;
    const handleWindowPointerMove = (event: PointerEvent): void => {
      if (activePointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      const point = getPlayfieldPoint(event.clientX, event.clientY);
      if (point) moveFrame(point);
    };
    const handleWindowPointerEnd = (event: PointerEvent): void => {
      releasePointer(event.pointerId);
    };
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [getPlayfieldPoint, moveFrame, open, phase, releasePointer]);

  useEffect(() => {
    if (!open || phase !== "chase") return;
    const handleWindowTouchMove = (event: TouchEvent): void => {
      if (!activeTouchRef.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      const point = getPlayfieldPoint(touch.clientX, touch.clientY);
      if (point) moveFrame(point);
    };
    const handleWindowTouchEnd = (): void => {
      activeTouchRef.current = false;
    };
    window.addEventListener("touchmove", handleWindowTouchMove, { passive: false });
    window.addEventListener("touchend", handleWindowTouchEnd);
    window.addEventListener("touchcancel", handleWindowTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowTouchEnd);
      window.removeEventListener("touchcancel", handleWindowTouchEnd);
    };
  }, [getPlayfieldPoint, moveFrame, open, phase]);

  const handlePlayfieldPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (phase !== "chase") return;
    const point = getPlayfieldPoint(event.clientX, event.clientY);
    if (!point) return;
    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    moveFrame(point);
    const setPointerCapture = event.currentTarget.setPointerCapture;
    if (typeof setPointerCapture === "function") {
      try {
        setPointerCapture.call(event.currentTarget, event.pointerId);
      } catch {
        // キャプチャに対応しない環境でも、ウィンドウ側の監視でスワイプを継続する。
      }
    }
  };

  const handlePlayfieldPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (phase !== "chase" || activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    const point = getPlayfieldPoint(event.clientX, event.clientY);
    if (point) moveFrame(point);
  };

  const handlePlayfieldPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    releasePointer(event.pointerId);
  };

  const handlePlayfieldTouchStart = (event: ReactTouchEvent<HTMLDivElement>): void => {
    if (phase !== "chase") return;
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    activeTouchRef.current = true;
    const point = getPlayfieldPoint(touch.clientX, touch.clientY);
    if (point) moveFrame(point);
  };

  const handlePlayfieldTouchMove = (event: ReactTouchEvent<HTMLDivElement>): void => {
    if (phase !== "chase" || !activeTouchRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    const point = getPlayfieldPoint(touch.clientX, touch.clientY);
    if (point) moveFrame(point);
  };

  const handlePlayfieldTouchEnd = (): void => {
    activeTouchRef.current = false;
  };

  const handlePlayfieldKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (phase !== "chase") return;
    const step = 0.09;
    const offset = event.key === "ArrowLeft"
      ? { x: -step, y: 0 }
      : event.key === "ArrowRight"
        ? { x: step, y: 0 }
        : event.key === "ArrowUp"
          ? { x: 0, y: -step }
          : event.key === "ArrowDown"
            ? { x: 0, y: step }
            : null;
    if (!offset) return;
    event.preventDefault();
    moveFrame({
      x: chaseRef.current.frame.x + offset.x,
      y: chaseRef.current.frame.y + offset.y,
    });
  };

  if (!open) return null;

  const isFishInFrame = phase === "chase" && isFishingFishInFrame(
    chase.fish.position,
    chase.frame,
    fish.catchFrameSize,
    fish.fishSize,
  );
  const progressPercent = Math.min(100, Math.round(chase.focusProgressMs / Math.max(1, fish.catchDurationMs) * 100));
  const remainingTimeMs = Math.max(0, chase.remainingTimeMs);
  const remainingSeconds = Math.ceil(remainingTimeMs / 1_000);
  const fishPosition = {
    left: `${chase.fish.position.x * 100}%`,
    top: `${chase.fish.position.y * 100}%`,
  };
  const framePosition = {
    left: `${chase.frame.x * 100}%`,
    top: `${chase.frame.y * 100}%`,
    width: `${fish.catchFrameSize * 100}%`,
    height: `${fish.catchFrameSize * 100}%`,
  };

  const handleBite = (): void => {
    if (phase === "bite") setPhase("chase");
  };

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

        <div className={`fishing-stage fishing-stage-${phase}`} aria-live="polite">
          {phase === "chase" ? (
            <div
              className="fishing-playfield"
              ref={playfieldRef}
              role="button"
              tabIndex={0}
              aria-label="魚釣りエリア。タップやスワイプした場所へ枠を移動できます。"
              onPointerDown={handlePlayfieldPointerDown}
              onPointerMove={handlePlayfieldPointerMove}
              onPointerUp={handlePlayfieldPointerUp}
              onPointerCancel={handlePlayfieldPointerUp}
              onTouchStart={handlePlayfieldTouchStart}
              onTouchMove={handlePlayfieldTouchMove}
              onTouchEnd={handlePlayfieldTouchEnd}
              onTouchCancel={handlePlayfieldTouchEnd}
              onKeyDown={handlePlayfieldKeyDown}
            >
              <div className="fishing-underwater-rays" aria-hidden="true" />
              <div className="fishing-water-bubble fishing-water-bubble-one" aria-hidden="true" />
              <div className="fishing-water-bubble fishing-water-bubble-two" aria-hidden="true" />
              <div
                className={`fishing-time-limit ${remainingSeconds <= 3 ? "is-urgent" : ""}`}
                role="timer"
                aria-label={`残り時間 ${remainingSeconds}秒`}
              >
                <span aria-hidden="true">⏱</span>
                <strong>{remainingSeconds}</strong>
                <small>秒</small>
              </div>
              <div
                className={`fishing-fish ${chase.fish.velocity.x < 0 ? "is-facing-left" : ""}`}
                style={fishPosition}
                aria-hidden="true"
              >
                <FishIcon fishType={fish.type} />
              </div>
              <div
                className={`fishing-catch-frame ${isFishInFrame ? "is-locking" : ""}`}
                style={framePosition}
                aria-hidden="true"
              >
                <span className="fishing-catch-frame-corner fishing-catch-frame-corner-top-left" />
                <span className="fishing-catch-frame-corner fishing-catch-frame-corner-top-right" />
                <span className="fishing-catch-frame-corner fishing-catch-frame-corner-bottom-left" />
                <span className="fishing-catch-frame-corner fishing-catch-frame-corner-bottom-right" />
              </div>
              <span className="fishing-tap-hint">タップ・スワイプで枠を移動</span>
            </div>
          ) : (
            <>
              <div className="fishing-cloud fishing-cloud-left" aria-hidden="true" />
              <div className="fishing-cloud fishing-cloud-right" aria-hidden="true" />
              <div className="fishing-water-line" aria-hidden="true" />
              <svg
                className="fishing-stage-art"
                viewBox="0 0 100 278"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path className="fishing-rod" d="M -5 35 L 47.5 131" />
                <path className="fishing-rod-tip" d="M 45.5 127 L 47.5 131" />
                <path
                  className="fishing-line"
                  d="M 47.5 131 C 47.5 148 46.8 164 49 178 C 50 187 51 196 50.5 207"
                />
              </svg>
              <div className="fishing-ripples" aria-hidden="true">
                <span />
                <span />
              </div>
              <div className={`fishing-bobber fishing-bobber-${phase}`} aria-hidden="true">
                <span className="fishing-bobber-body" />
                <span className="fishing-bobber-top" />
                {phase === "bite" && <span className="fishing-bobber-alert">!</span>}
              </div>
            </>
          )}
        </div>

        {phase === "chase" && (
          <div className="fishing-catch-progress-wrap">
            <div className="fishing-catch-progress-heading">
              <span>{isFishInFrame ? "ロックオン中！" : "魚を枠に入れよう"}</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div
              className="fishing-catch-progress"
              role="progressbar"
              aria-label="捕獲ゲージ"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="fishing-status-copy">
          <p className="fishing-phase-message">{getPhaseMessage(phase)}</p>
          {phase === "waiting" && <small>しばらくすると魚が食いつきます。</small>}
          {phase === "bite" && <small>魚ごとにタップできる時間が違います。</small>}
          {phase === "chase" && (
            <small>魚：{fish.name} / 捕獲ゲージ：{progressPercent}% / 残り{remainingSeconds}秒</small>
          )}
          {phase === "caught" && (
            <div className="fishing-result-card">
              <span className="fishing-result-icon" aria-hidden="true"><FishIcon fishType={fish.type} /></span>
              <span><strong>{fish.name}</strong><small>{fish.rarityLabel}の魚をゲット！</small></span>
            </div>
          )}
          {phase === "escaped" && <small>もう一度、桟橋から挑戦できます。</small>}
        </div>

        <div className="fishing-action-slot">
          {phase === "bite" && (
            <button
              className="primary-button fishing-action-button fishing-bite-button"
              type="button"
              onClick={handleBite}
              aria-label="魚が食いついたのでタップ"
            >
              ！ タップ！
            </button>
          )}
          {phase === "chase" && <small className="fishing-action-tip">時間内に、枠が魚に重なっている状態を続けましょう</small>}
          {(phase === "caught" || phase === "escaped") && (
            <div className="panel-actions fishing-result-actions">
              <button className="primary-button fishing-action-button" type="button" onClick={startRound}>もう一度釣る</button>
              <button className="subtle-button fishing-action-button" type="button" onClick={close}>閉じる</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
