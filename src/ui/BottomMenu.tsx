import { useGameStore } from "../store/gameStore";

export function BottomMenu(): JSX.Element {
  const currentMap = useGameStore((store) => store.game.currentMap);
  const isVillage = currentMap === "village";
  const buildOpen = useGameStore((store) => store.isBuildMenuOpen);
  const residentOpen = useGameStore((store) => store.isResidentPanelOpen);
  const mode = useGameStore((store) => store.interactionMode);
  const setBuildOpen = useGameStore((store) => store.setBuildMenuOpen);
  const setResidentOpen = useGameStore((store) => store.setResidentPanelOpen);
  const cancel = useGameStore((store) => store.cancelInteraction);
  const beginFarming = useGameStore((store) => store.beginFarming);
  const travelToMap = useGameStore((store) => store.travelToMap);

  const toggleBuild = (): void => {
    if (!isVillage) return;
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
    if (!isVillage) return;
    setBuildOpen(false);
    setResidentOpen(false);
    if (mode === "farm") {
      cancel();
      return;
    }
    beginFarming();
  };

  const toggleMap = (): void => {
    setBuildOpen(false);
    setResidentOpen(false);
    if (mode !== "inspect") cancel();
    travelToMap(currentMap === "village" ? "sea-and-river" : "village");
  };

  return (
    <nav className="bottom-menu" aria-label="マップメニュー">
      <button
        type="button"
        className={`bottom-menu-button ${buildOpen ? "is-active" : ""}`}
        onClick={toggleBuild}
        disabled={!isVillage}
        title={!isVillage ? "村でのみ使えます" : undefined}
      >
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
        disabled={!isVillage}
        title={!isVillage ? "村でのみ使えます" : undefined}
      >
        <span className="menu-icon crop-menu-icon">🌱</span>
        <span>作物</span>
      </button>
      <button
        type="button"
        className={`bottom-menu-button ${currentMap !== "village" ? "is-active" : ""}`}
        aria-pressed={currentMap !== "village"}
        onClick={toggleMap}
      >
        <span className="menu-icon crop-menu-icon">🌊</span>
        <span>{currentMap === "village" ? "海と川" : "村へ戻る"}</span>
      </button>
    </nav>
  );
}
