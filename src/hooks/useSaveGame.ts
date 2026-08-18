import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

export function useSaveGame(): void {
  const save = useGameStore((store) => store.save);
  useEffect(() => {
    const timer = window.setInterval(save, 5_000);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", save);
    };
  }, [save]);
}
