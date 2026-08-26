import { useCallback, useEffect, useRef, useState } from "react";

export type PwaInstallOutcome = "accepted" | "dismissed";
export type PwaInstallStatus =
  | "unavailable"
  | "available"
  | "prompting"
  | "awaiting-install"
  | "dismissed"
  | "installed";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: readonly string[];
  readonly userChoice: PromiseLike<{
    outcome: PwaInstallOutcome;
    platform: string;
  }>;
  prompt(): PromiseLike<void> | void;
}

export interface PwaInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isPrompting: boolean;
  status: PwaInstallStatus;
  install: () => Promise<void>;
}

type EventWithInstallPromptFields = Event & {
  prompt?: unknown;
  userChoice?: unknown;
};

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if ((typeof value !== "object" && typeof value !== "function") || value === null) return false;
  return "then" in value && typeof value.then === "function";
}

function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  const candidate = event as EventWithInstallPromptFields;
  return typeof candidate.prompt === "function" && isPromiseLike(candidate.userChoice);
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  const displayModeStandalone = typeof window.matchMedia === "function"
    && window.matchMedia("(display-mode: standalone)").matches;
  const safariStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
  return displayModeStandalone || safariStandalone;
}

export function usePwaInstall(): PwaInstallState {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const isPromptingRef = useRef(false);
  const statusRef = useRef<PwaInstallStatus>("unavailable");
  const [status, setStatusState] = useState<PwaInstallStatus>(() => {
    const initialStatus = isStandaloneDisplayMode() ? "installed" : "unavailable";
    statusRef.current = initialStatus;
    return initialStatus;
  });

  const setStatus = (nextStatus: PwaInstallStatus): void => {
    statusRef.current = nextStatus;
    setStatusState(nextStatus);
  };

  useEffect(() => {
    const updateStandaloneState = (): void => {
      const standalone = isStandaloneDisplayMode();
      if (!standalone) return;
      setStatus("installed");
      deferredPromptRef.current = null;
    };

    const handleBeforeInstallPrompt = (event: Event): void => {
      if (!isBeforeInstallPromptEvent(event)) return;
      if (statusRef.current === "installed" || isStandaloneDisplayMode()) return;
      event.preventDefault();
      deferredPromptRef.current = event;
      setStatus("available");
    };

    const handleAppInstalled = (): void => {
      deferredPromptRef.current = null;
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const standaloneQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)")
      : null;
    if (standaloneQuery) {
      if (typeof standaloneQuery.addEventListener === "function") {
        standaloneQuery.addEventListener("change", updateStandaloneState);
      } else {
        standaloneQuery.addListener(updateStandaloneState);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (!standaloneQuery) return;
      if (typeof standaloneQuery.removeEventListener === "function") {
        standaloneQuery.removeEventListener("change", updateStandaloneState);
      } else {
        standaloneQuery.removeListener(updateStandaloneState);
      }
    };
  }, []);

  const install = useCallback(async (): Promise<void> => {
    if (status !== "available" || isPromptingRef.current) return;
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return;

    deferredPromptRef.current = null;
    isPromptingRef.current = true;
    setStatus("prompting");
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "dismissed") {
        setStatus("dismissed");
      } else if (statusRef.current !== "installed") {
        setStatus("awaiting-install");
      }
    } catch {
      // The browser may reject the prompt when installation is no longer available.
      if (statusRef.current !== "installed") setStatus("unavailable");
    } finally {
      isPromptingRef.current = false;
    }
  }, [status]);

  return {
    canInstall: status === "available",
    isInstalled: status === "installed",
    isPrompting: status === "prompting",
    status,
    install,
  };
}
