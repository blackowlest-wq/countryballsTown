import { useCallback, useEffect, useRef, useState } from "react";
import { VillageBgm } from "../audio/VillageBgm";

const BGM_PREFERENCE_KEY = "countryball-town-bgm-enabled";

function readBgmPreference(): boolean {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(BGM_PREFERENCE_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeBgmPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(BGM_PREFERENCE_KEY, enabled ? "on" : "off");
  } catch {
    // localStorageが使えない環境でも、BGM自体は利用できるようにする。
  }
}

export function BgmToggle(): JSX.Element {
  const bgmRef = useRef<VillageBgm | null>(null);
  const enabledRef = useRef(readBgmPreference());
  const shouldResumeRef = useRef(false);
  const [enabled, setEnabled] = useState(enabledRef.current);
  const [available, setAvailable] = useState(true);

  const startBgm = useCallback((): void => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    void bgm.start().then((started) => {
      if (started) {
        shouldResumeRef.current = true;
        return;
      }
      shouldResumeRef.current = false;
      enabledRef.current = false;
      setEnabled(false);
      setAvailable(false);
      writeBgmPreference(false);
    });
  }, []);

  useEffect(() => {
    const bgm = new VillageBgm();
    bgmRef.current = bgm;

    const stopBgm = (): void => {
      bgm.stop();
    };

    const restartBgm = (): void => {
      if (enabledRef.current && shouldResumeRef.current) startBgm();
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        stopBgm();
        return;
      }
      restartBgm();
    };

    const startOnFirstInteraction = (event: Event): void => {
      if (event.target instanceof Element && event.target.closest(".bgm-toggle")) return;
      window.removeEventListener("pointerdown", startOnFirstInteraction);
      window.removeEventListener("keydown", startOnFirstInteraction);
      if (enabledRef.current) startBgm();
    };

    window.addEventListener("pointerdown", startOnFirstInteraction, { once: true, passive: true });
    window.addEventListener("keydown", startOnFirstInteraction, { once: true });
    window.addEventListener("pagehide", stopBgm);
    window.addEventListener("beforeunload", stopBgm);
    window.addEventListener("pageshow", restartBgm);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointerdown", startOnFirstInteraction);
      window.removeEventListener("keydown", startOnFirstInteraction);
      window.removeEventListener("pagehide", stopBgm);
      window.removeEventListener("beforeunload", stopBgm);
      window.removeEventListener("pageshow", restartBgm);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      bgm.dispose();
      bgmRef.current = null;
    };
  }, [startBgm]);

  const toggleBgm = (): void => {
    const nextEnabled = !enabledRef.current;
    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);
    writeBgmPreference(nextEnabled);

    if (nextEnabled) {
      startBgm();
    } else {
      shouldResumeRef.current = false;
      bgmRef.current?.stop();
    }
  };

  const label = !available ? "BGM非対応" : enabled ? "BGM ON" : "BGM OFF";
  const description = !available
    ? "このブラウザではBGMを再生できません"
    : enabled
      ? "BGMをオフにする"
      : "BGMをオンにする";

  return (
    <button
      className="bgm-toggle"
      type="button"
      aria-label={description}
      aria-pressed={enabled}
      disabled={!available}
      onClick={toggleBgm}
    >
      <span className="bgm-toggle-icon" aria-hidden="true">{enabled ? "♫" : "♪"}</span>
      <span>{label}</span>
    </button>
  );
}
