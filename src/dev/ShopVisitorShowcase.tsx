import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { OrthographicCamera } from "three";
import type { Resident } from "../game/types/Resident";
import type { ShopVisitor } from "../game/types/ShopVisitor";
import { PizzaShop } from "../scene/buildings/PizzaShop";
import { CountryBall } from "../scene/residents/CountryBall";
import { ShopVisitorCharacter } from "../scene/visitors/ShopVisitorCharacter";

const italyResident: Resident = {
  id: "showcase-visitor-italy",
  countryId: "italy",
  position: { x: 7.6, z: 11.2 },
  state: "idle",
};

const shopFocus = { x: 9.5, z: 9.5 };
const visitors: ShopVisitor[] = [
  {
    id: "showcase-visitor-buying",
    shopBuildingId: "showcase-pizza-shop",
    color: "#6fa8dc",
    position: { x: 9.95, z: 11.15 },
    destination: { x: 9.95, z: 11.15 },
    lookAt: shopFocus,
    phase: "buying",
    joinedAt: 0,
  },
  {
    id: "showcase-visitor-waiting-1",
    shopBuildingId: "showcase-pizza-shop",
    color: "#b47cc7",
    position: { x: 9.95, z: 12.07 },
    destination: { x: 9.95, z: 12.07 },
    lookAt: shopFocus,
    phase: "waiting",
    joinedAt: 1,
  },
  {
    id: "showcase-visitor-waiting-2",
    shopBuildingId: "showcase-pizza-shop",
    color: "#e58f65",
    position: { x: 9.95, z: 12.99 },
    destination: { x: 9.95, z: 12.99 },
    lookAt: shopFocus,
    phase: "waiting",
    joinedAt: 2,
  },
  {
    id: "showcase-visitor-leaving",
    shopBuildingId: "showcase-pizza-shop",
    color: "#66ad91",
    position: { x: 11.8, z: 12.2 },
    destination: { x: 14.5, z: 14.5 },
    phase: "leaving",
    joinedAt: 3,
  },
];

function ShowcaseCamera(): null {
  const { camera } = useThree();

  useEffect(() => {
    const activeCamera = camera as OrthographicCamera;
    activeCamera.lookAt(0.25, 0.95, 0.8);
    activeCamera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function ShowcaseScene(): JSX.Element {
  return (
    <>
      <color attach="background" args={["#9bd2ed"]} />
      <ambientLight intensity={1.35} />
      <directionalLight castShadow position={[5, 10, 8]} intensity={1.8} />
      <hemisphereLight args={["#fff2d1", "#6f9279", 0.6]} />
      <ShowcaseCamera />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[11, 10]} />
        <meshStandardMaterial color="#b7d18b" roughness={1} />
      </mesh>
      <PizzaShop />
      <CountryBall resident={italyResident} />
      {visitors.map((visitor) => (
        <ShopVisitorCharacter key={visitor.id} visitor={visitor} />
      ))}
    </>
  );
}

export function ShopVisitorShowcase(): JSX.Element {
  return (
    <main className="showcase-shell">
      <div className="showcase-heading">
        <p>DEVELOPMENT SHOWCASE</p>
        <h1>ピザ屋の来訪客</h1>
        <span>国旗住民と単色の来訪客／整列・購入・持ち帰りを比較</span>
      </div>
      <div className="showcase-legend" aria-label="来訪客の確認ポイント">
        <span>単色の小さな体</span>
        <span>最大3人の列</span>
        <span>購入コイン</span>
        <span>持ち帰り袋</span>
      </div>
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        camera={{ position: [5.8, 7.4, 7.8], zoom: 72, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ShowcaseScene />
      </Canvas>
    </main>
  );
}
