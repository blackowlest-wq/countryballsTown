import { Canvas } from "@react-three/fiber";
import type { Resident, ResidentMotion } from "../game/types/Resident";
import { CountryBall } from "../scene/residents/CountryBall";

interface ShowcaseMotionResident extends Resident {
  motion: ResidentMotion;
}

function motionResident(
  id: string,
  countryId: string,
  x: number,
  z: number,
  motion: ResidentMotion,
  extra: Partial<Resident> = {},
): ShowcaseMotionResident {
  return {
    id,
    countryId,
    position: { x, z },
    state: motion === "idle" ? "idle" : "action",
    motion,
    ...extra,
  };
}

const showcaseResidents: ShowcaseMotionResident[] = [
  motionResident("motion-idle", "poland", 3, 4, "idle"),
  motionResident("motion-tree", "japan", 6, 4, "look-tree", { lookAt: { x: 7.2, z: 4 } }),
  motionResident("motion-fountain", "italy", 9, 4, "look-fountain", { lookAt: { x: 10.2, z: 4 } }),
  motionResident("motion-building", "poland", 12, 4, "use-building", { actionBuildingId: "house", lookAt: { x: 13.2, z: 4 } }),
  motionResident("motion-happy", "japan", 15, 4, "happy"),
  motionResident("motion-sleeping", "italy", 4.5, 9, "sleeping"),
  motionResident("motion-falling", "poland", 7.5, 9, "falling"),
  motionResident("motion-talking-a", "japan", 10.5, 9, "talking", {
    targetResidentId: "motion-talking-b",
    lookAt: { x: 11.7, z: 9 },
  }),
  motionResident("motion-talking-b", "italy", 11.7, 9, "talking", {
    targetResidentId: "motion-talking-a",
    lookAt: { x: 10.5, z: 9 },
  }),
  motionResident("motion-heart-a", "poland", 14.5, 9, "heart", {
    targetResidentId: "motion-heart-b",
    lookAt: { x: 15.7, z: 9 },
  }),
  motionResident("motion-heart-b", "japan", 15.7, 9, "heart", {
    targetResidentId: "motion-heart-a",
    lookAt: { x: 14.5, z: 9 },
  }),
];

function ShowcaseScene(): JSX.Element {
  return (
    <>
      <color attach="background" args={["#9bd2ed"]} />
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        position={[5, 14, 8]}
        intensity={1.8}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={["#fff2d1", "#6f9279", 0.6]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[19, 15]} />
        <meshStandardMaterial color="#b7d18b" roughness={1} />
      </mesh>
      {showcaseResidents.map((resident) => (
        <CountryBall key={resident.id} resident={resident} />
      ))}
    </>
  );
}

export function MotionShowcase(): JSX.Element {
  return (
    <main className="showcase-shell motion-showcase-shell">
      <div className="showcase-heading">
        <p>DEVELOPMENT SHOWCASE</p>
        <h1>モーション表示確認</h1>
        <span>固定位置・住民の自律行動をまとめて確認</span>
      </div>
      <div className="motion-showcase-legend" aria-label="モーション一覧">
        <span>ぼーっとする</span>
        <span>木を見る</span>
        <span>噴水を見る</span>
        <span>建物を利用する</span>
        <span>喜ぶ</span>
        <span>寝る</span>
        <span>転ぶ</span>
        <span>2人で会話する</span>
        <span>近づいてハート</span>
      </div>
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 9, 16], zoom: 34, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ShowcaseScene />
      </Canvas>
    </main>
  );
}
