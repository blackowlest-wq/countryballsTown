import { GRID_SIZE } from "../game/constants/gameConstants";
import { gridToWorld } from "../utils/grid";

const cityHouses = [
  { x: 3.2, z: 3.4, color: "#e79a79", roof: "#c85f58" },
  { x: 16.6, z: 3.4, color: "#e8bd72", roof: "#b8794e" },
  { x: 3.2, z: 15.7, color: "#9abfdb", roof: "#627ea8" },
  { x: 16.6, z: 15.7, color: "#d8a2c6", roof: "#9a678f" },
];

function worldPosition(x: number, z: number): [number, number, number] {
  const position = gridToWorld({ x, z });
  return [position.x, 0, position.z];
}

function CityHouse({ x, z, color, roof }: {
  x: number;
  z: number;
  color: string;
  roof: string;
}): JSX.Element {
  const [worldX, , worldZ] = worldPosition(x, z);
  return (
    <group name="街の家" position={[worldX, 0, worldZ]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.2, 1.1, 1.8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.34, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[1.55, 1.15, 4]} />
        <meshStandardMaterial color={roof} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 0.93]}>
        <boxGeometry args={[0.46, 0.62, 0.04]} />
        <meshStandardMaterial color="#805c55" roughness={0.8} />
      </mesh>
      <mesh position={[-0.65, 0.7, 0.93]}>
        <boxGeometry args={[0.38, 0.34, 0.04]} />
        <meshStandardMaterial color="#a9dce1" roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  );
}

function StreetLamp({ x, z }: { x: number; z: number }): JSX.Element {
  const [worldX, , worldZ] = worldPosition(x, z);
  return (
    <group name="街灯" position={[worldX, 0, worldZ]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.45, 8]} />
        <meshStandardMaterial color="#52626d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshStandardMaterial color="#ffe6a2" emissive="#ffd26a" emissiveIntensity={0.45} />
      </mesh>
      <pointLight color="#ffd991" intensity={0.22} distance={3.2} position={[0, 1.45, 0]} />
    </group>
  );
}

export function CityMap(): JSX.Element {
  const centralPosition = gridToWorld({ x: 10, z: 10 });
  return (
    <group name="街マップ">
      <mesh
        name="街の地面"
        rotation-x={-Math.PI / 2}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#d6c6a8" roughness={1} />
      </mesh>

      <group name="街路">
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0.5]} receiveShadow>
          <planeGeometry args={[GRID_SIZE, 2.1]} />
          <meshStandardMaterial color="#adaca7" roughness={1} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0.5, -0.005, 0]} receiveShadow>
          <planeGeometry args={[2.1, GRID_SIZE]} />
          <meshStandardMaterial color="#adaca7" roughness={1} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0.5, 0, 0.5]}>
          <circleGeometry args={[2.3, 32]} />
          <meshStandardMaterial color="#c9b783" roughness={0.95} />
        </mesh>
      </group>

      <group name="街の広場" position={[centralPosition.x, 0, centralPosition.z]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.85, 0.95, 0.36, 12]} />
          <meshStandardMaterial color="#a7c8c2" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.35, 0.45, 0.35, 12]} />
          <meshStandardMaterial color="#72b8b3" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <sphereGeometry args={[0.28, 16, 10]} />
          <meshStandardMaterial color="#b9e4de" roughness={0.3} />
        </mesh>
      </group>

      {cityHouses.map((house) => <CityHouse key={`${house.x}-${house.z}`} {...house} />)}
      <StreetLamp x={6.3} z={6.2} />
      <StreetLamp x={13.8} z={6.2} />
      <StreetLamp x={6.3} z={13.8} />
      <StreetLamp x={13.8} z={13.8} />
    </group>
  );
}
