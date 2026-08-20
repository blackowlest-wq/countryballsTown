import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Mesh } from "three";
import {
  WHEAT_GREEN_STAGE_MS,
  WHEAT_MATURE_STAGE_MS,
} from "../../game/constants/gameConstants";
import {
  getWheatGrowthStage,
  type WheatGrowthStage,
} from "../../game/systems/WheatSystem";
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

function getStalkColor(stage: WheatGrowthStage, index: number): string {
  if (stage === "green") return index % 2 === 0 ? "#5d9948" : "#73aa52";
  return index % 2 === 0 ? "#96612f" : "#aa7037";
}

function useGrowthStage(crop: WheatCrop): WheatGrowthStage {
  const [stage, setStage] = useState(() => getWheatGrowthStage(crop, Date.now()));

  useEffect(() => {
    const updateStage = (): void => setStage(getWheatGrowthStage(crop, Date.now()));
    updateStage();
    const now = Date.now();
    const timers = [
      crop.plantedAt + WHEAT_GREEN_STAGE_MS,
      crop.plantedAt + WHEAT_MATURE_STAGE_MS,
    ]
      .filter((transitionAt) => transitionAt > now)
      .map((transitionAt) => window.setTimeout(updateStage, transitionAt - now + 20));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [crop]);

  return stage;
}

function WheatPlant({ crop }: { crop: WheatCrop }): JSX.Element {
  const stage = useGrowthStage(crop);
  const readyRing = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (readyRing.current) {
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
      {stage === "seed" && (
        <group position={[0, 0.065, 0]}>
          {[-0.2, 0, 0.2].map((offset) => (
            <mesh key={offset} position={[offset, 0.025, 0]} castShadow>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshStandardMaterial color="#d7bd72" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}
      {stage !== "seed" && (
        <group position={[0, 0.07, 0]}>
          {STALKS.map((stalk, index) => (
            <group
              key={`${stalk.x}:${stalk.z}`}
              position={[stalk.x, 0, stalk.z]}
              rotation-z={stalk.rotation}
            >
              <mesh castShadow position={[0, stalk.height / 2, 0]}>
                <cylinderGeometry args={[0.025, 0.035, stalk.height, 6]} />
                <meshStandardMaterial
                  color={getStalkColor(stage, index)}
                  roughness={0.85}
                />
              </mesh>
              <mesh castShadow position={[0, stalk.height + 0.08, 0]}>
                <capsuleGeometry args={[0.055, 0.15, 4, 6]} />
                <meshStandardMaterial
                  color={stage === "green" ? "#84b75b" : "#bd8341"}
                  roughness={0.82}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {stage === "mature" && (
        <mesh
          ref={readyRing}
          rotation-x={-Math.PI / 2}
          position={[0, 0.055, 0]}
        >
          <ringGeometry args={[0.42, 0.47, 24]} />
          <meshBasicMaterial color="#f2b85c" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
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
          <group
            key={`${crop.gridX}:${crop.gridY}:${crop.plantedAt}`}
            position={[position.x, 0, position.z]}
          >
            <WheatPlant crop={crop} />
          </group>
        );
      })}
    </group>
  );
}
