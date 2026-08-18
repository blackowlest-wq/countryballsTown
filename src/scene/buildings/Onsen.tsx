import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

export function Onsen(): JSX.Element {
  const steam = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!steam.current) return;
    steam.current.position.y = Math.sin(clock.elapsedTime * 1.8) * 0.04;
  });

  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2.45, 0.5, 1.45]} />
        <meshStandardMaterial color="#d9c5a5" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[1.95, 0.12, 1.05]} />
        <meshStandardMaterial color="#67b8ca" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.72, -0.58]}>
        <boxGeometry args={[2.45, 0.85, 0.14]} />
        <meshStandardMaterial color="#bd5149" />
      </mesh>
      <mesh position={[-0.72, 0.94, -0.51]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.8, 10]} />
        <meshStandardMaterial color="#5e4033" />
      </mesh>
      <mesh position={[0.72, 0.94, -0.51]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.8, 10]} />
        <meshStandardMaterial color="#5e4033" />
      </mesh>
      <group ref={steam} position={[0, 1.05, 0]}>
        <mesh position={[-0.33, 0, 0]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.36} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0.3, 0.04, 0]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.34} />
        </mesh>
      </group>
    </group>
  );
}
