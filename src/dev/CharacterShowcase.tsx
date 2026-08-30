import { Canvas, useThree } from "@react-three/fiber";
import type { Resident } from "../game/types/Resident";
import { CountryBall } from "../scene/residents/CountryBall";

const showcaseResidents: Resident[] = [
  {
    id: "showcase-poland",
    countryId: "poland",
    position: { x: 4, z: 10 },
    state: "idle",
  },
  {
    id: "showcase-japan",
    countryId: "japan",
    position: { x: 7, z: 10 },
    state: "idle",
  },
  {
    id: "showcase-italy",
    countryId: "italy",
    position: { x: 10, z: 10 },
    state: "idle",
  },
  {
    id: "showcase-china",
    countryId: "china",
    position: { x: 13, z: 10 },
    state: "idle",
  },
  {
    id: "showcase-usa",
    countryId: "usa",
    position: { x: 16, z: 10 },
    state: "idle",
  },
];

function ShowcaseScene(): JSX.Element {
  const { size } = useThree();
  const isNarrow = size.width < 600;
  const residents = showcaseResidents.map((resident, index) => isNarrow
    ? {
        ...resident,
        position: { x: 7.2 + index * 1.4, z: resident.position.z },
      }
    : resident);

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
      />
      <hemisphereLight args={["#fff2d1", "#6f9279", 0.6]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[18, 10]} />
        <meshStandardMaterial color="#b7d18b" roughness={1} />
      </mesh>
      {residents.map((resident) => (
        <CountryBall key={resident.id} resident={resident} />
      ))}
    </>
  );
}

export function CharacterShowcase(): JSX.Element {
  return (
    <main className="showcase-shell">
      <div className="showcase-heading">
        <p>DEVELOPMENT SHOWCASE</p>
        <h1>キャラクター表示確認</h1>
        <span>固定位置・正面向き／国旗は球体マテリアルで描画</span>
      </div>
      <div className="showcase-legend" aria-label="確認対象">
        <span><i className="showcase-dot poland" />ポーランド</span>
        <span><i className="showcase-dot japan" />日本</span>
        <span><i className="showcase-dot italy" />イタリア</span>
        <span><i className="showcase-dot china" />中国</span>
        <span><i className="showcase-dot usa" />アメリカ</span>
      </div>
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 6.5, 14], zoom: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ShowcaseScene />
      </Canvas>
    </main>
  );
}
