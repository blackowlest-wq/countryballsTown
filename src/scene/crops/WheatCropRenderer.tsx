import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { getWheatGrowthProgress } from "../../game/systems/WheatSystem";
import type { WheatCrop } from "../../game/types/Crop";
import { useGameStore } from "../../store/gameStore";
import { gridToWorld } from "../../utils/grid";

const STALKS = [
  { x: -0.19, z: -0.12, height: 0.66, rotation: -0.08 },
  { x: 0.02, z: -0.2, height: 0.8, rotation: 0.03 },
  { x: 0.2, z: -0.06, height: 0.7, rotation: 0.08 },
  { x: -0.08, z: 0.13, height: 0.74, rotation: -0.04 },
  { x: 0.16, z: 0.18, height: 0.62, rotation: 0.06 },
] as const;

function WheatPlant({ crop }: { crop: WheatCrop }): JSX.Element {
  const sprout = useRef<Group>(null);
  const wheat = useRef<Group>(null);
  const readyRing = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const progress = getWheatGrowthProgress(crop, Date.now());
    if (sprout.current) {
      const sproutScale = Math.max(0, 1 - Math.max(0, progress - 0.45) / 0.35);
      sprout.current.scale.set(1, 0.25 + progress * 0.75, sproutScale);
      sprout.current.visible = sproutScale > 0.02;
    }
    if (wheat.current) {
      const wheatScale = Math.max(0.04, (progress - 0.28) / 0.72);
      wheat.current.scale.set(1, wheatScale, 1);
    }
    if (readyRing.current) {
      readyRing.current.visible = progress >= 1;
      const pulse = 1 + Math.sin(clock.elapsedTime * 4.5) * 0.06;
      readyRing.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[0.84, 0.07, 0.84]} />
        <meshStandardMaterial color="#8f633c" roughness={1} />
      </mesh>
      <group ref={sprout} position={[0, 0.07, 0]}>
        <mesh position={[-0.12, 0.13, 0]} rotation-z={-0.42}>
          <capsuleGeometry args={[0.045, 0.24, 4, 8]} />
          <meshStandardMaterial color="#73a94d" roughness={0.9} />
        </mesh>
        <mesh position={[0.12, 0.15, 0]} rotation-z={0.42}>
          <capsuleGeometry args={[0.045, 0.28, 4, 8]} />
          <meshStandardMaterial color="#8abd57" roughness={0.9} />
        </mesh>
      </group>
      <group ref={wheat} position={[0, 0.07, 0]} scale={[1, 0.04, 1]}>
        {STALKS.map((stalk, index) => (
          <group
            key={`${stalk.x}:${stalk.z}`}
            position={[stalk.x, 0, stalk.z]}
            rotation-z={stalk.rotation}
          >
            <mesh castShadow position={[0, stalk.height / 2, 0]}>
              <cylinderGeometry args={[0.025, 0.035, stalk.height, 6]} />
              <meshStandardMaterial color={index % 2 === 0 ? "#d7a83e" : "#e1b84e"} roughness={0.85} />
            </mesh>
            <mesh castShadow position={[0, stalk.height + 0.08, 0]}>
              <capsuleGeometry args={[0.055, 0.15, 4, 6]} />
              <meshStandardMaterial color="#edc45c" roughness={0.82} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh
        ref={readyRing}
        visible={false}
        rotation-x={-Math.PI / 2}
        position={[0, 0.055, 0]}
      >
        <ringGeometry args={[0.42, 0.47, 24]} />
        <meshBasicMaterial color="#ffe28a" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function WheatCropRenderer(): JSX.Element {
  const crops = useGameStore((store) => store.game.wheatCrops);
  return (
    <group>
      {crops.map((crop) => {
        const position = gridToWorld({ x: crop.gridX, z: crop.gridY });
        return (
          <group key={`${crop.gridX}:${crop.gridY}`} position={[position.x, 0, position.z]}>
            <WheatPlant crop={crop} />
          </group>
        );
      })}
    </group>
  );
}
