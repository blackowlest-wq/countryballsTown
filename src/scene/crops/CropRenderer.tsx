import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Mesh } from "three";
import {
  CROP_GREEN_STAGE_MS,
  CROP_MATURE_STAGE_MS,
} from "../../game/constants/gameConstants";
import {
  getCropGrowthStage,
  type CropGrowthStage,
} from "../../game/systems/CropSystem";
import type { Crop } from "../../game/types/Crop";
import { useGameStore } from "../../store/gameStore";
import { gridToWorld } from "../../utils/grid";

const WHEAT_STALKS = [
  { x: -0.19, z: -0.12, height: 0.66, rotation: -0.08 },
  { x: 0.02, z: -0.2, height: 0.8, rotation: 0.03 },
  { x: 0.2, z: -0.06, height: 0.7, rotation: 0.08 },
  { x: -0.08, z: 0.13, height: 0.74, rotation: -0.04 },
  { x: 0.16, z: 0.18, height: 0.62, rotation: 0.06 },
] as const;

const TOMATO_FRUIT = [
  { x: -0.2, y: 0.46, z: 0.09 },
  { x: 0.18, y: 0.58, z: -0.08 },
  { x: 0.07, y: 0.34, z: 0.2 },
] as const;

function getWheatStalkColor(stage: CropGrowthStage, index: number): string {
  if (stage === "green") return index % 2 === 0 ? "#5d9948" : "#73aa52";
  return index % 2 === 0 ? "#96612f" : "#aa7037";
}

function useGrowthStage(crop: Crop): CropGrowthStage {
  const [stage, setStage] = useState(() => getCropGrowthStage(crop, Date.now()));

  useEffect(() => {
    const updateStage = (): void => setStage(getCropGrowthStage(crop, Date.now()));
    updateStage();
    const now = Date.now();
    const timers = [
      crop.plantedAt + CROP_GREEN_STAGE_MS,
      crop.plantedAt + CROP_MATURE_STAGE_MS,
    ]
      .filter((transitionAt) => transitionAt > now)
      .map((transitionAt) => window.setTimeout(updateStage, transitionAt - now + 20));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [crop]);

  return stage;
}

function ReadyRing({ color }: { color: string }): JSX.Element {
  const ring = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 4.5) * 0.06;
    ring.current.scale.setScalar(pulse);
  });
  return (
    <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.11, 0]}>
      <ringGeometry args={[0.42, 0.47, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

function SeedMounds({ cropType }: { cropType: Crop["type"] }): JSX.Element {
  return (
    <group position={[0, 0.095, 0]} name={`${cropType}-seeds`}>
      {[-0.2, 0, 0.2].map((offset) => (
        <mesh key={offset} position={[offset, 0.025, 0]} castShadow>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial
            color={cropType === "wheat" ? "#d7bd72" : "#b9915f"}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function WheatPlant({ stage }: { stage: CropGrowthStage }): JSX.Element {
  return (
    <group name={stage === "mature" ? "収穫できる小麦" : "成長中の小麦"}>
      <group position={[0, 0.09, 0]}>
        {WHEAT_STALKS.map((stalk, index) => (
          <group
            key={`${stalk.x}:${stalk.z}`}
            position={[stalk.x, 0, stalk.z]}
            rotation-z={stalk.rotation}
          >
            <mesh castShadow position={[0, stalk.height / 2, 0]}>
              <cylinderGeometry args={[0.025, 0.035, stalk.height, 6]} />
              <meshStandardMaterial color={getWheatStalkColor(stage, index)} roughness={0.85} />
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
      {stage === "mature" && <ReadyRing color="#f2b85c" />}
    </group>
  );
}

function TomatoVine({ stage }: { stage: CropGrowthStage }): JSX.Element {
  const mature = stage === "mature";
  return (
    <group name={mature ? "収穫できるトマト" : "緑のトマトのツル"}>
      <group position={[0, 0.1, 0]}>
        <mesh castShadow position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.035, 0.055, 0.68, 7]} />
          <meshStandardMaterial color="#4f963f" roughness={0.88} />
        </mesh>
        {[-1, 1].map((direction) => (
          <group key={direction} scale-x={direction}>
            <mesh position={[0.13, 0.43, 0]} rotation-z={-0.72} castShadow>
              <cylinderGeometry args={[0.018, 0.026, 0.32, 6]} />
              <meshStandardMaterial color="#579f43" roughness={0.88} />
            </mesh>
            <mesh position={[0.27, 0.54, 0]} scale={[0.18, 0.06, 0.11]} castShadow>
              <sphereGeometry args={[1, 10, 7]} />
              <meshStandardMaterial color="#6cac4f" roughness={0.88} />
            </mesh>
            <mesh position={[0.18, 0.28, 0.04]} scale={[0.15, 0.05, 0.1]} castShadow>
              <sphereGeometry args={[1, 10, 7]} />
              <meshStandardMaterial color="#75b556" roughness={0.88} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.71, 0]} scale={[0.16, 0.055, 0.12]} castShadow>
          <sphereGeometry args={[1, 10, 7]} />
          <meshStandardMaterial color="#69aa4e" roughness={0.88} />
        </mesh>
        {mature && TOMATO_FRUIT.map((fruit) => (
          <group key={`${fruit.x}:${fruit.y}:${fruit.z}`} position={[fruit.x, fruit.y, fruit.z]}>
            <mesh castShadow>
              <sphereGeometry args={[0.12, 12, 9]} />
              <meshStandardMaterial color="#dc4f3f" roughness={0.72} />
            </mesh>
            <mesh position={[0, 0.1, 0]} rotation-x={Math.PI}>
              <coneGeometry args={[0.08, 0.05, 5]} />
              <meshStandardMaterial color="#43883b" roughness={0.88} />
            </mesh>
          </group>
        ))}
      </group>
      {mature && <ReadyRing color="#e96b52" />}
    </group>
  );
}

function CropPlant({ crop }: { crop: Crop }): JSX.Element {
  const stage = useGrowthStage(crop);
  if (stage === "seed") return <SeedMounds cropType={crop.type} />;
  return crop.type === "wheat"
    ? <WheatPlant stage={stage} />
    : <TomatoVine stage={stage} />;
}

export function CropRenderer(): JSX.Element {
  const crops = useGameStore((store) => store.game.crops);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const harvestCrop = useGameStore((store) => store.harvestCrop);
  return (
    <group>
      {crops.map((crop) => {
        const position = gridToWorld({ x: crop.gridX, z: crop.gridY });
        return (
          <group
            key={`${crop.type}:${crop.gridX}:${crop.gridY}:${crop.plantedAt}`}
            position={[position.x, 0, position.z]}
            onClick={(event) => {
              if (interactionMode !== "inspect") return;
              event.stopPropagation();
              harvestCrop(crop.gridX, crop.gridY);
            }}
          >
            <CropPlant crop={crop} />
          </group>
        );
      })}
    </group>
  );
}
