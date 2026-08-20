import { useGameStore } from "../store/gameStore";

export function BottomMenu(): JSX.Element {
  const buildOpen = useGameStore((store) => store.isBuildMenuOpen);
  const residentOpen = useGameStore((store) => store.isResidentPanelOpen);
  const mode = useGameStore((store) => store.interactionMode);
  const setBuildOpen = useGameStore((store) => store.setBuildMenuOpen);
  const setResidentOpen = useGameStore((store) => store.setResidentPanelOpen);
  const cancel = useGameStore((store) => store.cancelInteraction);
  const beginFarming = useGameStore((store) => store.beginFarming);

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

  const toggleFarming = (): void => {
    setBuildOpen(false);
    setResidentOpen(false);
    if (mode === "farm") {
      cancel();
      return;
    }
    beginFarming();
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
      <button
        type="button"
        className={`bottom-menu-button ${mode === "farm" ? "is-active" : ""}`}
        aria-pressed={mode === "farm"}
        onClick={toggleFarming}
      >
        <span className="menu-icon crop-menu-icon">🌱</span>
        <span>作物</span>
      </button>
    </nav>
  );
}
