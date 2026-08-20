import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import {
  getPorkFactoryProductName,
} from "../../game/systems/PorkFactorySystem";
import type { PorkFactoryProductType } from "../../game/types/PorkFactory";

interface PorkFactoryProps {
  productType?: PorkFactoryProductType | null;
}

function FactoryMark({ productType }: PorkFactoryProps): JSX.Element {
  const mark = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!mark.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.06;
    mark.current.scale.setScalar(pulse);
    mark.current.rotation.y = Math.sin(clock.elapsedTime * 1.4) * 0.08;
  });

  if (!productType) {
    return (
      <group ref={mark} name="豚肉工場を設定してください" position={[0, 1.45, 0]}>
        <mesh>
          <sphereGeometry args={[0.28, 16, 12]} />
          <meshStandardMaterial
            color="#fff0e8"
            emissive="#d8786e"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, -0.01, 0.25]}>
          <boxGeometry args={[0.07, 0.25, 0.07]} />
          <meshStandardMaterial color="#b75450" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.15, 0.25]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color="#b75450" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={mark}
      name={`${getPorkFactoryProductName(productType)}を生産中`}
      position={[0, 1.35, 0]}
    >
      <mesh>
        <sphereGeometry args={[0.22, 14, 10]} />
        <meshStandardMaterial color="#fff9f2" emissive="#f5d7d0" emissiveIntensity={0.25} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.01, 0.2]}>
        <boxGeometry args={[0.14, 0.14, 0.06]} />
        <meshStandardMaterial
          color={productType === "ham" ? "#e99285" : productType === "sausage" ? "#c86e5c" : "#9d5c4e"}
          roughness={0.55}
        />
      </mesh>
    </group>
  );
}

export function PorkFactory({ productType }: PorkFactoryProps): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.78, 0.78, 0.72]} />
        <meshStandardMaterial color="#ead7d1" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow>
        <boxGeometry args={[0.86, 0.1, 0.8]} />
        <meshStandardMaterial color="#b76f64" roughness={0.72} />
      </mesh>
      <mesh position={[0.22, 0.88, 0.18]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 10]} />
        <meshStandardMaterial color="#fff2ea" roughness={0.65} />
      </mesh>
      <mesh position={[-0.24, 0.98, -0.1]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 0.38, 10]} />
        <meshStandardMaterial color="#996e69" roughness={0.72} />
      </mesh>
      <mesh position={[-0.24, 1.2, -0.1]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
        <meshStandardMaterial color="#815b58" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.45, 0.37]}>
        <boxGeometry args={[0.38, 0.25, 0.03]} />
        <meshStandardMaterial color="#fff6ee" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.45, 0.39]}>
        <boxGeometry args={[0.18, 0.1, 0.02]} />
        <meshStandardMaterial color="#d88678" roughness={0.55} />
      </mesh>
      <FactoryMark productType={productType} />
    </group>
  );
}
