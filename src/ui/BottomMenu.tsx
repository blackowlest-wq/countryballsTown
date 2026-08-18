import { useGameStore } from "../store/gameStore";

export function BottomMenu(): JSX.Element {
  const buildOpen = useGameStore((store) => store.isBuildMenuOpen);
  const residentOpen = useGameStore((store) => store.isResidentPanelOpen);
  const mode = useGameStore((store) => store.interactionMode);
  const setBuildOpen = useGameStore((store) => store.setBuildMenuOpen);
  const setResidentOpen = useGameStore((store) => store.setResidentPanelOpen);
  const cancel = useGameStore((store) => store.cancelInteraction);

  const toggleBuild = (): void => {
    setResidentOpen(false);
    if (mode !== "inspect") cancel();
    setBuildOpen(!buildOpen);
  };

  const toggleResidents = (): void => {
    setBuildOpen(false);
    if (mode !== "inspect") cancel();
    setResidentOpen(!residentOpen);
  };

  return (
    <nav className="bottom-menu" aria-label="村のメニュー">
      <button type="button" className={`bottom-menu-button ${buildOpen ? "is-active" : ""}`} onClick={toggleBuild}>
        <span className="menu-icon">⌂</span>
        <span>建築</span>
      </button>
      <button type="button" className={`bottom-menu-button ${residentOpen ? "is-active" : ""}`} onClick={toggleResidents}>
        <span className="menu-icon">●●</span>
        <span>住民</span>
      </button>
    </nav>
  );
}
