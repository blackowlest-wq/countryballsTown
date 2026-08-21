import { GRID_SIZE } from "../game/constants/gameConstants";
import {
  getRiverCenterX,
  SEA_START_X,
} from "../game/systems/MapSystem";
import { gridToWorld } from "../utils/grid";

const RIVER_SEGMENTS = [
  { z: 2.1, length: 4.8 },
  { z: 6.2, length: 4.8 },
  { z: 10.3, length: 4.8 },
  { z: 14.4, length: 4.8 },
  { z: 18.1, length: 4.0 },
];

const SEA_COLOR = "#70c6df";
const RIVER_COLOR = "#80cfe1";

function getRiverRotation(gridZ: number): number {
  const slope = getRiverCenterX(gridZ + 0.5) - getRiverCenterX(gridZ - 0.5);
  return Math.atan2(slope, 2);
}

export function SeaAndRiverMap(): JSX.Element {
  const seaStart = gridToWorld({ x: SEA_START_X, z: GRID_SIZE / 2 }).x;
  const seaWidth = GRID_SIZE / 2 - seaStart;
  const seaCenter = seaStart + seaWidth / 2;

  return (
    <group name="海と川のマップ">
      <mesh
        name="砂浜"
        rotation-x={-Math.PI / 2}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#d9cf9b" roughness={1} />
      </mesh>

      <mesh
        name="海"
        rotation-x={-Math.PI / 2}
        position={[seaCenter, -0.025, 0]}
        receiveShadow
      >
        <planeGeometry args={[seaWidth, GRID_SIZE]} />
        <meshStandardMaterial color={SEA_COLOR} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh
        name="海岸線"
        position={[seaStart, 0.015, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.16, 0.08, GRID_SIZE]} />
        <meshStandardMaterial color="#f2dfaa" roughness={1} />
      </mesh>

      <group name="川">
        {RIVER_SEGMENTS.map((segment) => {
          const center = gridToWorld({
            x: getRiverCenterX(segment.z),
            z: segment.z,
          });
          return (
            <mesh
              key={segment.z}
              rotation-x={-Math.PI / 2}
              rotation-y={getRiverRotation(segment.z)}
              position={[center.x, -0.005, center.z]}
              receiveShadow
            >
              <planeGeometry args={[2.15, segment.length]} />
              <meshStandardMaterial color={RIVER_COLOR} roughness={0.5} />
            </mesh>
          );
        })}
      </group>

      <group name="波紋">
        {[2.8, 7.2, 12.6, 17.2].map((gridZ, index) => (
          <mesh
            key={gridZ}
            rotation-x={-Math.PI / 2}
            position={[seaStart + 1.45 + (index % 2) * 0.65, 0.02, gridToWorld({ x: 0, z: gridZ }).z]}
          >
            <planeGeometry args={[0.8, 0.055]} />
            <meshBasicMaterial color="#dff8f7" transparent opacity={0.72} />
          </mesh>
        ))}
      </group>

      <group name="桟橋">
        {[4.5, 12.5].map((gridZ) => (
          <group key={gridZ} position={[seaStart - 0.15, 0.08, gridToWorld({ x: 0, z: gridZ }).z]}>
            <mesh position={[0.7, 0, 0]} receiveShadow>
              <boxGeometry args={[1.65, 0.12, 0.55]} />
              <meshStandardMaterial color="#a9784f" roughness={0.9} />
            </mesh>
            {[-0.45, 0.45].map((offset) => (
              <mesh key={offset} position={[offset + 0.7, -0.18, 0]} castShadow>
                <cylinderGeometry args={[0.055, 0.07, 0.45, 8]} />
                <meshStandardMaterial color="#7d573d" roughness={1} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
