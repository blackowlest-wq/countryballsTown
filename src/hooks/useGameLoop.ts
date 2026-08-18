import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

export function useGameLoop(): void {
  const tick = useGameStore((store) => store.tick);

  useEffect(() => {
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(500, Math.max(0, now - last));
      last = now;
      tick(delta, Date.now());
    }, 120);
    return () => window.clearInterval(timer);
  }, [tick]);
}
