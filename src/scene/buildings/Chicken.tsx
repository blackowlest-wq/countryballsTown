import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import {
  useAnimalWander,
  type AnimalWanderFence,
  type AnimalWanderOrigin,
} from "./animalWander";

interface ChickenProps {
  eggReadyAt?: number;
  wanderSeed?: string;
  wanderOrigin?: AnimalWanderOrigin;
  wanderFences?: readonly AnimalWanderFence[];
}

function useEggReady(eggReadyAt?: number): boolean {
  const [ready, setReady] = useState(
    () => eggReadyAt !== undefined && Date.now() >= eggReadyAt,
  );

  useEffect(() => {
    if (eggReadyAt === undefined) {
      setReady(false);
      return;
    }
    const remainingMs = eggReadyAt - Date.now();
    if (remainingMs <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), remainingMs + 20);
    return () => window.clearTimeout(timer);
  }, [eggReadyAt]);

  return ready;
}

function EggReadyMark(): JSX.Element {
  return (
    <group name="卵を収穫できます">
      <mesh castShadow scale={[0.82, 1.08, 0.82]}>
        <sphereGeometry args={[0.27, 16, 12]} />
        <meshStandardMaterial
          color="#fffdf4"
          emissive="#ffe8a8"
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, -0.27, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 16]} />
        <meshStandardMaterial color="#e8aa4f" roughness={0.55} />
      </mesh>
    </group>
  );
}

export function Chicken({ eggReadyAt, wanderSeed, wanderOrigin, wanderFences }: ChickenProps): JSX.Element {
  const animal = useRef<Group>(null);
  const body = useRef<Group>(null);
  const eggMark = useRef<Group>(null);
  const eggReady = useEggReady(eggReadyAt);
  useAnimalWander(animal, wanderSeed, wanderOrigin, wanderFences);

  useFrame(({ clock }) => {
    if (body.current) {
      body.current.position.y = Math.sin(clock.elapsedTime * 1.9) * 0.012;
      body.current.rotation.z = Math.sin(clock.elapsedTime * 1.5) * 0.018;
    }
    if (eggMark.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.06;
      eggMark.current.scale.setScalar(pulse);
      eggMark.current.rotation.y = Math.sin(clock.elapsedTime * 1.4) * 0.08;
    }
  });

  return (
    <group ref={animal}>
      <group ref={body}>
        <mesh position={[0, 0.55, 0]} scale={[0.95, 0.9, 0.78]} castShadow>
          <sphereGeometry args={[0.4, 16, 12]} />
          <meshStandardMaterial color="#fff8e9" roughness={0.88} />
        </mesh>
        {[-0.16, 0.16].map((x) => (
          <group key={x} position={[x, 0.19, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.04, 0.05, 0.3, 7]} />
              <meshStandardMaterial color="#d69745" roughness={0.88} />
            </mesh>
            <mesh position={[0, -0.16, 0]} castShadow>
              <boxGeometry args={[0.12, 0.06, 0.16]} />
              <meshStandardMaterial color="#c27a38" roughness={0.92} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.38, 0.69, 0]} scale={[0.78, 0.82, 0.76]} castShadow>
          <sphereGeometry args={[0.29, 14, 10]} />
          <meshStandardMaterial color="#fffaf0" roughness={0.86} />
        </mesh>
        <mesh position={[0.61, 0.59, 0]} rotation-y={Math.PI / 2}>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <meshStandardMaterial color="#eca44a" roughness={0.8} />
        </mesh>
        {[-0.1, 0.1].map((z) => (
          <mesh key={z} position={[0.59, 0.76, z]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#3b3029" roughness={0.8} />
          </mesh>
        ))}
        <group position={[0.38, 0.94, 0]}>
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshStandardMaterial color="#db5b4f" roughness={0.75} />
            </mesh>
          ))}
        </group>
        {[-0.2, 0.2].map((z) => (
          <mesh key={z} position={[0.05, 0.62, z]} rotation-x={z < 0 ? -0.25 : 0.25}>
            <sphereGeometry args={[0.24, 12, 8]} />
            <meshStandardMaterial color="#f1dcae" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {eggReady && (
        <group ref={eggMark} position={[0, 1.36, 0]}>
          <EggReadyMark />
        </group>
      )}
    </group>
  );
}
