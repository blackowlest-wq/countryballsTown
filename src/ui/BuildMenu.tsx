import { BuildingSelector } from "./BuildingSelector";
import { useGameStore } from "../store/gameStore";

export function BuildMenu(): JSX.Element | null {
  const isOpen = useGameStore((store) => store.isBuildMenuOpen);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const setOpen = useGameStore((store) => store.setBuildMenuOpen);
  if (!isOpen || interactionMode === "build") return null;

  return (
    <section className="floating-panel build-menu" aria-label="建築メニュー">
      <BuildingSelector onClose={() => setOpen(false)} />
    </section>
  );
}
