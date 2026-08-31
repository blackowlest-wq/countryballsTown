import { useGameStore } from "../store/gameStore";

export function BottomMenu(): JSX.Element {
  const currentMap = useGameStore((store) => store.game.currentMap);
  const isVillage = currentMap === "village";
  const buildOpen = useGameStore((store) => store.isBuildMenuOpen);
  const residentOpen = useGameStore((store) => store.isResidentPanelOpen);
  const mapTravelOpen = useGameStore((store) => store.isMapTravelOpen);
  const mode = useGameStore((store) => store.interactionMode);
  const setBuildOpen = useGameStore((store) => store.setBuildMenuOpen);
  const setResidentOpen = useGameStore((store) => store.setResidentPanelOpen);
  const cancel = useGameStore((store) => store.cancelInteraction);
  const beginFarming = useGameStore((store) => store.beginFarming);
  const openMapTravel = useGameStore((store) => store.openMapTravel);
  const closeMapTravel = useGameStore((store) => store.closeMapTravel);
  const buildActive = buildOpen || mode === "build";

  const toggleBuild = (): void => {
    if (!isVillage) return;
    setResidentOpen(false);
    closeMapTravel();
    if (mode !== "inspect") cancel();
    setBuildOpen(!buildOpen);
  };

  const toggleResidents = (): void => {
    setBuildOpen(false);
    closeMapTravel();
    if (mode !== "inspect") cancel();
    setResidentOpen(!residentOpen);
  };

  const toggleFarming = (): void => {
    if (!isVillage) return;
    setBuildOpen(false);
    setResidentOpen(false);
    closeMapTravel();
    if (mode === "farm") {
      cancel();
      return;
    }
    beginFarming();
  };

  const toggleMap = (): void => {
    setBuildOpen(false);
    setResidentOpen(false);
    if (mapTravelOpen) {
      closeMapTravel();
      return;
    }
    if (mode !== "inspect") cancel();
    openMapTravel();
  };

  return (
    <nav className="bottom-menu is-packed" aria-label="マップメニュー">
      <button
        type="button"
        className={`bottom-menu-button ${buildActive ? "is-active" : ""}`}
        aria-pressed={buildActive}
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
        className={`bottom-menu-button ${mapTravelOpen ? "is-active" : ""}`}
        aria-pressed={mapTravelOpen}
        onClick={toggleMap}
      >
        <span className="menu-icon crop-menu-icon">🧭</span>
        <span>移動</span>
      </button>
    </nav>
  );
}
