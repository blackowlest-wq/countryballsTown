import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { OrthographicCamera } from "three";
import type { Resident } from "../game/types/Resident";
import { PizzaShop } from "../scene/buildings/PizzaShop";
import { CountryBall } from "../scene/residents/CountryBall";

const italyResident: Resident = {
  id: "showcase-pizza-shop-italy",
  countryId: "italy",
  position: { x: 8.15, z: 11.45 },
  state: "idle",
  lookAt: { x: 9.5, z: 10.5 },
};

function ShowcaseCamera(): null {
  const { camera } = useThree();

  useEffect(() => {
    const activeCamera = camera as OrthographicCamera;
    activeCamera.lookAt(0, 1.05, 0.1);
    activeCamera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function ShowcaseScene(): JSX.Element {
  return (
    <>
      <color attach="background" args={["#9bd2ed"]} />
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        position={[5, 10, 8]}
        intensity={1.8}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <hemisphereLight args={["#fff2d1", "#6f9279", 0.6]} />
      <ShowcaseCamera />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#b7d18b" roughness={1} />
      </mesh>
      <PizzaShop />
      <CountryBall resident={italyResident} />
    </>
  );
}

export function PizzaShopShowcase(): JSX.Element {
  return (
    <main className="showcase-shell">
      <div className="showcase-heading">
        <p>DEVELOPMENT SHOWCASE</p>
        <h1>ピザ屋表示確認</h1>
        <span>村と同じモデル／イタリア住民を大きさの比較用に表示</span>
      </div>
      <div className="showcase-legend" aria-label="外観の確認ポイント">
        <span>赤いストライプ庇</span>
        <span>PIZZA看板</span>
        <span>小物は鉢植えのみ</span>
      </div>
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        camera={{ position: [5.4, 6.8, 5.4], zoom: 88, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ShowcaseScene />
      </Canvas>
    </main>
  );
}
