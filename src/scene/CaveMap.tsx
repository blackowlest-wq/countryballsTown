import { GRID_SIZE } from "../game/constants/gameConstants";
import { gridToWorld } from "../utils/grid";

const caveRocks = [
  { x: 1.1, z: 1.4, scale: 1.4 },
  { x: 4.1, z: 0.8, scale: 0.9 },
  { x: 8.1, z: 1.1, scale: 1.2 },
  { x: 13.2, z: 0.8, scale: 1.1 },
  { x: 18.5, z: 1.4, scale: 1.5 },
  { x: 0.9, z: 5.8, scale: 1.1 },
  { x: 19.1, z: 5.2, scale: 1.3 },
  { x: 1.1, z: 12.8, scale: 1.25 },
  { x: 18.8, z: 13.4, scale: 1.1 },
  { x: 1.4, z: 18.6, scale: 1.5 },
  { x: 5.3, z: 19.1, scale: 0.95 },
  { x: 10.2, z: 18.8, scale: 1.1 },
  { x: 15.2, z: 19.1, scale: 1.25 },
  { x: 18.7, z: 18.3, scale: 1.4 },
];

const crystals = [
  { x: 4.2, z: 4.1, color: "#74c8c7", scale: 0.8 },
  { x: 15.6, z: 4.4, color: "#a58bd5", scale: 0.65 },
  { x: 4.6, z: 15.4, color: "#77b9e2", scale: 0.7 },
  { x: 16, z: 15.2, color: "#d69bc2", scale: 0.85 },
];

function worldPosition(x: number, z: number): [number, number, number] {
  const position = gridToWorld({ x, z });
  return [position.x, 0, position.z];
}

function CaveRock({ x, z, scale }: { x: number; z: number; scale: number }): JSX.Element {
  const [worldX, , worldZ] = worldPosition(x, z);
  return (
    <group position={[worldX, 0, worldZ]} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <dodecahedronGeometry args={[0.72, 0]} />
        <meshStandardMaterial color="#4c4d56" roughness={1} />
      </mesh>
      <mesh position={[0.2, 0.98, -0.08]} castShadow>
        <coneGeometry args={[0.32, 0.8, 6]} />
        <meshStandardMaterial color="#696a74" roughness={1} />
      </mesh>
    </group>
  );
}

function CaveCrystal({ x, z, color, scale }: {
  x: number;
  z: number;
  color: string;
  scale: number;
}): JSX.Element {
  const [worldX, , worldZ] = worldPosition(x, z);
  return (
    <group position={[worldX, 0, worldZ]} scale={scale}>
      <mesh position={[-0.16, 0.28, 0]} rotation-z={-0.18} castShadow>
        <coneGeometry args={[0.16, 0.7, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.35} />
      </mesh>
      <mesh position={[0.14, 0.24, 0.06]} rotation-z={0.16} castShadow>
        <coneGeometry args={[0.13, 0.56, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.35} />
      </mesh>
      <pointLight color={color} intensity={0.35} distance={2.8} position={[0, 0.6, 0]} />
    </group>
  );
}

export function CaveMap(): JSX.Element {
  return (
    <group name="洞窟マップ">
      <mesh
        name="洞窟の床"
        rotation-x={-Math.PI / 2}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#6d6670" roughness={1} />
      </mesh>

      <mesh name="洞窟の中央広場" rotation-x={-Math.PI / 2} position={[0.5, -0.015, 0.5]} receiveShadow>
        <circleGeometry args={[6.6, 32]} />
        <meshStandardMaterial color="#817986" roughness={0.92} />
      </mesh>

      <group name="洞窟の入口" position={[0.5, 0, 8.8]}>
        <mesh position={[-1.05, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.58, 0.78, 2.2, 7]} />
          <meshStandardMaterial color="#555660" roughness={1} />
        </mesh>
        <mesh position={[1.05, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.58, 0.78, 2.2, 7]} />
          <meshStandardMaterial color="#555660" roughness={1} />
        </mesh>
        <mesh position={[0, 2.08, 0]} castShadow>
          <boxGeometry args={[2.55, 0.72, 0.9]} />
          <meshStandardMaterial color="#555660" roughness={1} />
        </mesh>
        <mesh position={[0, 0.02, 0.03]}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshBasicMaterial color="#292a36" />
        </mesh>
      </group>

      <group name="洞窟の岩">
        {caveRocks.map((rock) => <CaveRock key={`${rock.x}-${rock.z}`} {...rock} />)}
      </group>
      <group name="洞窟の結晶">
        {crystals.map((crystal) => <CaveCrystal key={`${crystal.x}-${crystal.z}`} {...crystal} />)}
      </group>

      <group name="洞窟の水たまり">
        <mesh rotation-x={-Math.PI / 2} position={[-3.2, 0.018, -2.5]}>
          <circleGeometry args={[1.35, 24]} />
          <meshStandardMaterial color="#5aa6b4" roughness={0.28} metalness={0.08} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[3.25, 0.018, 2.9]}>
          <circleGeometry args={[1.05, 24]} />
          <meshStandardMaterial color="#5aa6b4" roughness={0.28} metalness={0.08} />
        </mesh>
      </group>
    </group>
  );
}
