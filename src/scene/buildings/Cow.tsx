import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import {
  useAnimalWander,
  type AnimalWanderFence,
  type AnimalWanderOrigin,
} from "./animalWander";

interface CowProps {
  milkReadyAt?: number;
  wanderSeed?: string;
  wanderOrigin?: AnimalWanderOrigin;
  wanderFences?: readonly AnimalWanderFence[];
}

function useMilkReady(milkReadyAt?: number): boolean {
  const [ready, setReady] = useState(
    () => milkReadyAt !== undefined && Date.now() >= milkReadyAt,
  );

  useEffect(() => {
    if (milkReadyAt === undefined) {
      setReady(false);
      return;
    }
    const remainingMs = milkReadyAt - Date.now();
    if (remainingMs <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), remainingMs + 20);
    return () => window.clearTimeout(timer);
  }, [milkReadyAt]);

  return ready;
}

function MilkReadyMark(): JSX.Element {
  return (
    <group name="牛乳を収穫できます">
      <mesh castShadow>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial
          color="#fffdf4"
          emissive="#cfefff"
          emissiveIntensity={0.25}
          roughness={0.35}
        />
      </mesh>
      <group position={[0.03, -0.005, 0.245]}>
        <mesh>
          <boxGeometry args={[0.15, 0.2, 0.07]} />
          <meshStandardMaterial color="#f8fbf7" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.025, 0.04]}>
          <boxGeometry args={[0.16, 0.055, 0.02]} />
          <meshStandardMaterial color="#65b8d0" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.125, 0]}>
          <boxGeometry args={[0.08, 0.05, 0.07]} />
          <meshStandardMaterial color="#65b8d0" roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
}

export function Cow({ milkReadyAt, wanderSeed, wanderOrigin, wanderFences }: CowProps): JSX.Element {
  const animal = useRef<Group>(null);
  const body = useRef<Group>(null);
  const milkMark = useRef<Group>(null);
  const milkReady = useMilkReady(milkReadyAt);
  useAnimalWander(animal, wanderSeed, wanderOrigin, wanderFences);

  useFrame(({ clock }) => {
    if (body.current) {
      body.current.position.y = Math.sin(clock.elapsedTime * 1.7) * 0.012;
      body.current.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.012;
    }
    if (milkMark.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.06;
      milkMark.current.scale.setScalar(pulse);
      milkMark.current.rotation.y = Math.sin(clock.elapsedTime * 1.4) * 0.08;
    }
  });

  return (
    <group ref={animal}>
      <group ref={body}>
        <mesh position={[0, 0.58, 0]} scale={[1.15, 0.72, 0.68]} castShadow>
          <sphereGeometry args={[0.43, 16, 12]} />
          <meshStandardMaterial color="#f7f1df" roughness={0.85} />
        </mesh>
        <mesh position={[-0.18, 0.67, 0.285]} scale={[0.35, 0.24, 0.08]}>
          <sphereGeometry args={[0.43, 12, 8]} />
          <meshStandardMaterial color="#4a403b" roughness={0.9} />
        </mesh>
        <mesh position={[0.17, 0.49, 0.29]} scale={[0.27, 0.2, 0.07]}>
          <sphereGeometry args={[0.43, 12, 8]} />
          <meshStandardMaterial color="#4a403b" roughness={0.9} />
        </mesh>

        {[-0.28, 0.28].flatMap((x) => [-0.18, 0.18].map((z) => (
          <group key={`${x}:${z}`} position={[x, 0.19, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.055, 0.07, 0.34, 7]} />
              <meshStandardMaterial color="#f1ead8" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.18, 0]} castShadow>
              <boxGeometry args={[0.14, 0.08, 0.13]} />
              <meshStandardMaterial color="#4f443d" roughness={0.95} />
            </mesh>
          </group>
        )))}

        <mesh position={[0.48, 0.67, 0]} scale={[0.75, 0.83, 0.72]} castShadow>
          <sphereGeometry args={[0.3, 14, 10]} />
          <meshStandardMaterial color="#f7f1df" roughness={0.85} />
        </mesh>
        <mesh position={[0.69, 0.57, 0]} scale={[0.58, 0.48, 0.7]} castShadow>
          <sphereGeometry args={[0.25, 14, 10]} />
          <meshStandardMaterial color="#eab6aa" roughness={0.8} />
        </mesh>
        {[-0.11, 0.11].map((z) => (
          <mesh key={z} position={[0.675, 0.73, z]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#302b29" roughness={0.8} />
          </mesh>
        ))}
        {[-0.24, 0.24].map((z) => (
          <mesh key={z} position={[0.43, 0.83, z]} scale={[0.65, 0.32, 1]}>
            <sphereGeometry args={[0.13, 10, 7]} />
            <meshStandardMaterial color="#4a403b" roughness={0.9} />
          </mesh>
        ))}
        {[-0.11, 0.11].map((z) => (
          <mesh key={z} position={[0.48, 0.91, z]}>
            <coneGeometry args={[0.045, 0.15, 7]} />
            <meshStandardMaterial color="#d8c79f" roughness={0.85} />
          </mesh>
        ))}

        <group position={[-0.49, 0.65, 0]} rotation-z={-0.65}>
          <mesh position={[-0.12, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.025, 0.035, 0.28, 6]} />
            <meshStandardMaterial color="#4a403b" roughness={0.9} />
          </mesh>
          <mesh position={[-0.27, 0, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color="#4a403b" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {milkReady && (
        <group ref={milkMark} position={[0, 1.42, 0]}>
          <MilkReadyMark />
        </group>
      )}
    </group>
  );
}
