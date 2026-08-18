import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { getCountryDefinition } from "../../game/data/countries";
import type { Resident } from "../../game/types/Resident";
import { useGameStore } from "../../store/gameStore";
import { gridToWorld } from "../../utils/grid";

interface CountryBallProps {
  resident: Resident;
}

export function CountryBall({ resident }: CountryBallProps): JSX.Element {
  const group = useRef<Group>(null);
  const ballGroup = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const selectResident = useGameStore((store) => store.selectResident);
  const country = getCountryDefinition(resident.countryId);
  const colors = country?.flagColors ?? ["#fffaf2", "#9fb7d8"];
  const world = gridToWorld(resident.position);
  const bouncePhase = Array.from(resident.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) * 0.17;

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.elapsedTime;
    const isWalking = resident.state === "walking";
    const isAction = resident.state === "action";
    const bounceSpeed = isAction ? 4.2 : isWalking ? 5.2 : 2.35;
    const bounce = Math.abs(Math.sin(time * bounceSpeed + bouncePhase));
    const bounceHeight = isAction ? 0.26 : isWalking ? 0.17 : 0.09;
    const walkBob = isWalking ? Math.sin(time * 5.2 + bouncePhase) * 0.018 : 0;
    const landing = 1 - bounce;
    group.current.position.y = 0.72 + bounce * bounceHeight + walkBob;
    group.current.rotation.z = isWalking
      ? Math.sin(time * 4 + bouncePhase) * 0.045
      : 0;
    const targetScale = isAction ? 1.08 + Math.sin(time * 4) * 0.04 : 1;
    const squash = landing * (isAction ? 0.055 : 0.035);
    ballGroup.current?.scale.set(
      targetScale + squash,
      targetScale - squash * 0.7,
      targetScale + squash,
    );
    shadow.current?.scale.setScalar(1 - bounce * 0.18);
  });

  return (
    <group
      ref={group}
      position={[world.x, 0.72, world.z]}
      onClick={(event) => {
        event.stopPropagation();
        selectResident(resident.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <group ref={ballGroup}>
        <mesh castShadow>
          <sphereGeometry args={[0.48, 18, 14]} />
          <meshStandardMaterial color={colors[0]} roughness={0.8} />
        </mesh>
        <group position={[0, 0.02, 0.43]}>
          {country?.flagLayout === "vertical" ? (
            colors.map((color, index) => (
              <mesh key={color} position={[(index - 1) * 0.14, 0, 0]}>
                <planeGeometry args={[0.15, 0.29]} />
                <meshBasicMaterial color={color} />
              </mesh>
            ))
          ) : (
            colors.slice(0, 2).map((color, index) => (
              <mesh key={color} position={[0, (index === 0 ? 0.075 : -0.075), 0]}>
                <planeGeometry args={[0.3, 0.15]} />
                <meshBasicMaterial color={color} />
              </mesh>
            ))
          )}
        </group>
        <group position={[0, 0.1, 0.43]}>
          <mesh position={[-0.15, 0, 0.02]}>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshStandardMaterial color="#28323c" />
          </mesh>
          <mesh position={[0.15, 0, 0.02]}>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshStandardMaterial color="#28323c" />
          </mesh>
          <mesh position={[-0.13, 0.025, 0.07]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.17, 0.025, 0.07]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        {resident.state === "action" && (
          <group position={[0.5, 0.5, 0]}>
            <mesh>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshBasicMaterial color="#f4a6b7" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.18, 0.18, 0]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshBasicMaterial color="#f4a6b7" transparent opacity={0.65} />
            </mesh>
          </group>
        )}
      </group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, -0.64, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color="#71877a" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}
