import { useMemo } from "react";
import { Shape } from "three";
import type { ResidentMotion } from "../../game/types/Resident";

interface ResidentMotionEffectsProps {
  motion: ResidentMotion;
}

const NON_HEART_MARK_SCALE = 2;

function HeartMarker({ scale = 1 }: { scale?: number }): JSX.Element {
  const heartShape = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, -0.16);
    shape.bezierCurveTo(-0.22, -0.02, -0.28, 0.16, -0.14, 0.24);
    shape.bezierCurveTo(-0.06, 0.29, 0, 0.22, 0, 0.14);
    shape.bezierCurveTo(0, 0.22, 0.06, 0.29, 0.14, 0.24);
    shape.bezierCurveTo(0.28, 0.16, 0.22, -0.02, 0, -0.16);
    return shape;
  }, []);

  return (
    <mesh scale={[scale, scale, scale]}>
      <shapeGeometry args={[heartShape]} />
      <meshBasicMaterial color="#ed6b83" transparent opacity={0.92} side={2} />
    </mesh>
  );
}

export function ResidentMotionEffects({ motion }: ResidentMotionEffectsProps): JSX.Element | null {
  switch (motion) {
    case "look-tree":
      return (
        <group position={[0.2, 0.72, 0.08]} scale={NON_HEART_MARK_SCALE}>
          <mesh rotation-z={-0.35}>
            <coneGeometry args={[0.08, 0.18, 5]} />
            <meshBasicMaterial color="#72b957" />
          </mesh>
        </group>
      );
    case "look-fountain":
      return (
        <group position={[0.2, 0.72, 0.08]} scale={NON_HEART_MARK_SCALE}>
          <mesh>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#79cde0" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.11, 0.12, 0]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshBasicMaterial color="#d9f5fa" transparent opacity={0.85} />
          </mesh>
        </group>
      );
    case "use-building":
      return (
        <group position={[0.42, 0.65, 0.04]} scale={NON_HEART_MARK_SCALE}>
          <mesh>
            <sphereGeometry args={[0.075, 8, 6]} />
            <meshBasicMaterial color="#f5c66d" transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.17, 0.17, 0]}>
            <sphereGeometry args={[0.048, 8, 6]} />
            <meshBasicMaterial color="#f5c66d" transparent opacity={0.65} />
          </mesh>
        </group>
      );
    case "happy":
      return (
        <group position={[0, 0.8, 0.08]} scale={NON_HEART_MARK_SCALE}>
          <mesh>
            <octahedronGeometry args={[0.11, 0]} />
            <meshBasicMaterial color="#ffd36a" />
          </mesh>
          <mesh position={[-0.22, 0.08, 0]} scale={0.55}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshBasicMaterial color="#fff0a8" />
          </mesh>
          <mesh position={[0.22, 0.08, 0]} scale={0.55}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshBasicMaterial color="#fff0a8" />
          </mesh>
        </group>
      );
    case "sleeping":
      return (
        <group position={[0.28, 0.74, 0.08]} scale={NON_HEART_MARK_SCALE}>
          <mesh>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#b5cde8" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.1, 0.13, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshBasicMaterial color="#b5cde8" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.22, 0.3, 0]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial color="#b5cde8" transparent opacity={0.9} />
          </mesh>
        </group>
      );
    case "talking":
      return (
        <group position={[0.32, 0.72, 0.08]} scale={NON_HEART_MARK_SCALE}>
          <mesh>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshBasicMaterial color="#fffaf0" transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.04, 0, 0.1]}>
            <sphereGeometry args={[0.018, 6, 4]} />
            <meshBasicMaterial color="#d5a58b" />
          </mesh>
          <mesh position={[0.04, 0, 0.1]}>
            <sphereGeometry args={[0.018, 6, 4]} />
            <meshBasicMaterial color="#d5a58b" />
          </mesh>
        </group>
      );
    case "heart":
      return (
        <group position={[0.08, 0.84, 0.12]}>
          <HeartMarker scale={0.95} />
          <group position={[0.34, 0.2, -0.02]}>
            <HeartMarker scale={0.55} />
          </group>
        </group>
      );
    default:
      return null;
  }
}
