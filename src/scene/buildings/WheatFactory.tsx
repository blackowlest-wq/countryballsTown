import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { WheatFactoryProductType } from "../../game/types/WheatFactory";

interface WheatFactoryProps {
  productType?: WheatFactoryProductType | null;
}

export function WheatFactory({ productType }: WheatFactoryProps): JSX.Element {
  const mark = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!mark.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.06;
    mark.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.78, 0.78, 0.72]} />
        <meshStandardMaterial color="#e4d8b8" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow>
        <boxGeometry args={[0.86, 0.1, 0.8]} />
        <meshStandardMaterial color="#c69a52" roughness={0.72} />
      </mesh>
      <mesh position={[-0.22, 0.96, -0.08]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.38, 10]} />
        <meshStandardMaterial color="#8e9b78" roughness={0.72} />
      </mesh>
      <mesh position={[-0.22, 1.18, -0.08]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
        <meshStandardMaterial color="#71805e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, 0.37]}>
        <boxGeometry args={[0.38, 0.25, 0.03]} />
        <meshStandardMaterial color="#fff8df" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.45, 0.39]}>
        <boxGeometry args={[0.18, 0.1, 0.02]} />
        <meshStandardMaterial color="#c69a52" roughness={0.55} />
      </mesh>
      <group ref={mark} name={productType ? "小麦粉を生産中" : "小麦工場を設定してください"} position={[0, 1.45, 0]}>
        <mesh>
          <sphereGeometry args={[0.25, 16, 12]} />
          <meshStandardMaterial
            color={productType ? "#fff1b7" : "#fff5df"}
            emissive="#e1ad51"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, -0.01, 0.22]}>
          <boxGeometry args={[0.06, 0.25, 0.06]} />
          <meshStandardMaterial color="#b27b3f" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
