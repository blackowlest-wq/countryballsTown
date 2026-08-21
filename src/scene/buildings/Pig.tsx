import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import {
  useAnimalWander,
  type AnimalWanderFence,
  type AnimalWanderOrigin,
} from "./animalWander";

interface PigProps {
  porkReadyAt?: number;
  wanderSeed?: string;
  wanderOrigin?: AnimalWanderOrigin;
  wanderFences?: readonly AnimalWanderFence[];
}

function usePorkReady(porkReadyAt?: number): boolean {
  const [ready, setReady] = useState(
    () => porkReadyAt !== undefined && Date.now() >= porkReadyAt,
  );

  useEffect(() => {
    if (porkReadyAt === undefined) {
      setReady(false);
      return;
    }
    const remainingMs = porkReadyAt - Date.now();
    if (remainingMs <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), remainingMs + 20);
    return () => window.clearTimeout(timer);
  }, [porkReadyAt]);

  return ready;
}

function PorkReadyMark(): JSX.Element {
  return (
    <group name="豚肉を収穫できます">
      <mesh castShadow>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial
          color="#fff2e7"
          emissive="#ed8d79"
          emissiveIntensity={0.28}
          roughness={0.35}
        />
      </mesh>
      <group position={[0.03, -0.005, 0.245]}>
        <mesh>
          <boxGeometry args={[0.16, 0.2, 0.07]} />
          <meshStandardMaterial color="#c65d58" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.025, 0.04]}>
          <boxGeometry args={[0.17, 0.055, 0.02]} />
          <meshStandardMaterial color="#f1a18d" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.125, 0]}>
          <boxGeometry args={[0.08, 0.05, 0.07]} />
          <meshStandardMaterial color="#c65d58" roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
}

export function Pig({ porkReadyAt, wanderSeed, wanderOrigin, wanderFences }: PigProps): JSX.Element {
  const animal = useRef<Group>(null);
  const body = useRef<Group>(null);
  const porkMark = useRef<Group>(null);
  const porkReady = usePorkReady(porkReadyAt);
  useAnimalWander(animal, wanderSeed, wanderOrigin, wanderFences);

  useFrame(({ clock }) => {
    if (body.current) {
      body.current.position.y = Math.sin(clock.elapsedTime * 1.7) * 0.012;
      body.current.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.012;
    }
    if (porkMark.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.06;
      porkMark.current.scale.setScalar(pulse);
      porkMark.current.rotation.y = Math.sin(clock.elapsedTime * 1.4) * 0.08;
    }
  });

  return (
    <group ref={animal}>
      <group ref={body}>
        <mesh position={[0, 0.58, 0]} scale={[1.12, 0.72, 0.7]} castShadow>
          <sphereGeometry args={[0.43, 16, 12]} />
          <meshStandardMaterial color="#f4b6b3" roughness={0.86} />
        </mesh>
        {[-0.28, 0.28].flatMap((x) => [-0.18, 0.18].map((z) => (
          <group key={`${x}:${z}`} position={[x, 0.19, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.055, 0.07, 0.34, 7]} />
              <meshStandardMaterial color="#e28e91" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <boxGeometry args={[0.14, 0.08, 0.13]} />
              <meshStandardMaterial color="#bd656d" roughness={0.95} />
            </mesh>
          </group>
        )))}
        <mesh position={[0.48, 0.67, 0]} scale={[0.76, 0.83, 0.72]} castShadow>
          <sphereGeometry args={[0.3, 14, 10]} />
          <meshStandardMaterial color="#f5bdb8" roughness={0.86} />
        </mesh>
        <mesh position={[0.69, 0.57, 0]} scale={[0.58, 0.48, 0.7]} castShadow>
          <sphereGeometry args={[0.25, 14, 10]} />
          <meshStandardMaterial color="#ed9b9d" roughness={0.8} />
        </mesh>
        {[-0.11, 0.11].map((z) => (
          <mesh key={z} position={[0.675, 0.73, z]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#6d3f46" roughness={0.8} />
          </mesh>
        ))}
        {[-0.055, 0.055].map((z) => (
          <mesh key={z} position={[0.74, 0.58, z]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#84484e" roughness={0.8} />
          </mesh>
        ))}
        {[-0.24, 0.24].map((z) => (
          <mesh key={z} position={[0.43, 0.83, z]} scale={[0.65, 0.32, 1]}>
            <coneGeometry args={[0.13, 0.18, 7]} />
            <meshStandardMaterial color="#dd858b" roughness={0.9} />
          </mesh>
        ))}
        <group position={[-0.49, 0.65, 0]} rotation-z={-0.65}>
          <mesh position={[-0.15, 0, 0]} rotation-z={Math.PI / 2}>
            <torusGeometry args={[0.09, 0.025, 6, 12, Math.PI * 1.45]} />
            <meshStandardMaterial color="#d97983" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {porkReady && (
        <group ref={porkMark} position={[0, 1.42, 0]}>
          <PorkReadyMark />
        </group>
      )}
    </group>
  );
}
