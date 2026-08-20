import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CAMERA_DEFAULT_ZOOM } from "../game/constants/gameConstants";
import { BuildingRenderer } from "./buildings/BuildingRenderer";
import { CameraController } from "./CameraController";
import { Ground } from "./Ground";
import { PlacementGrid } from "./PlacementGrid";
import { ResidentRenderer } from "./residents/ResidentRenderer";
import { ShopVisitorRenderer } from "./visitors/ShopVisitorRenderer";
import { WheatCropRenderer } from "./crops/WheatCropRenderer";
import { useGameStore } from "../store/gameStore";

function SceneContents(): JSX.Element {
  return (
    <>
      <color attach="background" args={["#9bd2ed"]} />
      <fog attach="fog" args={["#9bd2ed", 32, 78]} />
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
      <Ground />
      <PlacementGrid />
      <WheatCropRenderer />
      <BuildingRenderer />
      <ResidentRenderer />
      <ShopVisitorRenderer />
    </>
  );
}

export function VillageScene(): JSX.Element {
  const interactionMode = useGameStore((store) => store.interactionMode);
  return (
    <div
      className={`scene-layer ${interactionMode === "farm" ? "is-farming" : ""}`}
      aria-label="村の3D画面"
    >
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        camera={{ position: [14, 18, 14], zoom: CAMERA_DEFAULT_ZOOM, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
