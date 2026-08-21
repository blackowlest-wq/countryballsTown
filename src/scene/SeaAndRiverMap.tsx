import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { GRID_SIZE } from "../game/constants/gameConstants";
import {
  getRiverHalfWidth,
  getRiverPathPoints,
  SEA_START_X,
} from "../game/systems/MapSystem";
import { gridToWorld } from "../utils/grid";

const SEA_COLOR = "#70c6df";
const RIVER_COLOR = "#80cfe1";

function createRiverGeometry(): BufferGeometry {
  const path = getRiverPathPoints();
  const vertices: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const previous = gridToWorld(path[Math.max(0, index - 1)]);
    const next = gridToWorld(path[Math.min(path.length - 1, index + 1)]);
    const worldPoint = gridToWorld(point);
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const halfWidth = getRiverHalfWidth(point.z);

    vertices.push(
      worldPoint.x + normalX * halfWidth,
      0,
      worldPoint.z + normalZ * halfWidth,
      worldPoint.x - normalX * halfWidth,
      0,
      worldPoint.z - normalZ * halfWidth,
    );
  });

  for (let index = 0; index < path.length - 1; index += 1) {
    const left = index * 2;
    const nextLeft = left + 2;
    const right = left + 1;
    const nextRight = left + 3;
    indices.push(left, nextLeft, right, right, nextLeft, nextRight);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function SeaAndRiverMap(): JSX.Element {
  const riverGeometry = useMemo(createRiverGeometry, []);
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
        position={[seaStart, -0.01, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.16, 0.08, GRID_SIZE]} />
        <meshStandardMaterial color="#f2dfaa" roughness={1} />
      </mesh>

      <group name="川">
        <mesh geometry={riverGeometry} position={[0, 0.005, 0]} receiveShadow>
          <meshStandardMaterial color={RIVER_COLOR} roughness={0.5} />
        </mesh>
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
