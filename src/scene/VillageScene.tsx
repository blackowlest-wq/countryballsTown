import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CAMERA_DEFAULT_ZOOM } from "../game/constants/gameConstants";
import { BuildingRenderer } from "./buildings/BuildingRenderer";
import { CameraController } from "./CameraController";
import { Ground } from "./Ground";
import { PlacementGrid } from "./PlacementGrid";
import { ResidentRenderer } from "./residents/ResidentRenderer";
import { ShopVisitorRenderer } from "./visitors/ShopVisitorRenderer";
import { CropRenderer } from "./crops/CropRenderer";
import { useGameStore } from "../store/gameStore";
import type { MapId } from "../game/types/Map";
import { SeaAndRiverMap } from "./SeaAndRiverMap";
import { CaveMap } from "./CaveMap";
import { CityMap } from "./CityMap";
import { getMapDefinition } from "../game/data/maps";

function SceneContents({ currentMap }: { currentMap: MapId }): JSX.Element {
  const isVillage = currentMap === "village";
  const background = currentMap === "village"
    ? "#9bd2ed"
    : currentMap === "sea-and-river"
      ? "#a8dff0"
      : currentMap === "cave"
        ? "#47434d"
        : "#b8d5dc";
  const mapScene = currentMap === "village"
    ? <Ground />
    : currentMap === "sea-and-river"
      ? <SeaAndRiverMap />
      : currentMap === "cave"
        ? <CaveMap />
        : <CityMap />;
  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 32, 78]} />
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        position={[10, 18, 8]}
        intensity={1.8}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <hemisphereLight args={["#fff2d1", "#6f9279", 0.6]} />
      <CameraController />
      {mapScene}
      {isVillage && <PlacementGrid />}
      {isVillage && <CropRenderer />}
      {isVillage && <BuildingRenderer />}
      <ResidentRenderer />
      {isVillage && <ShopVisitorRenderer />}
    </>
  );
}

export function VillageScene(): JSX.Element {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const currentMap = useGameStore((store) => store.game.currentMap);
  return (
    <div
      className={`scene-layer ${interactionMode === "farm" ? "is-farming" : ""}`}
      aria-label={`${getMapDefinition(currentMap).name}の3D画面`}
    >
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        camera={{ position: [14, 18, 14], zoom: CAMERA_DEFAULT_ZOOM, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneContents currentMap={currentMap} />
        </Suspense>
      </Canvas>
    </div>
  );
}
