import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ShopVisitor } from "../../game/types/ShopVisitor";
import { gridToWorld } from "../../utils/grid";

interface ShopVisitorCharacterProps {
  visitor: ShopVisitor;
}

const VISITOR_RADIUS = 0.4;

function PurchaseMarker(): JSX.Element {
  return (
    <group position={[0.34, 0.73, 0.04]}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.11, 0.11, 0.035, 12]} />
        <meshStandardMaterial color="#f5bd45" emissive="#c77a21" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <octahedronGeometry args={[0.045, 0]} />
        <meshBasicMaterial color="#fff3ad" />
      </mesh>
    </group>
  );
}

function TakeawayBag(): JSX.Element {
  return (
    <group position={[0.36, -0.08, 0.18]}>
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.25, 0.13]} />
        <meshStandardMaterial color="#f2d49b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[0.07, 0.018, 6, 10, Math.PI]} />
        <meshStandardMaterial color="#a96f42" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function ShopVisitorCharacter({ visitor }: ShopVisitorCharacterProps): JSX.Element {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const heading = useRef(0);
  const world = gridToWorld(visitor.position);
  const bouncePhase = Array.from(visitor.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) * 0.13;

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.elapsedTime;
    const isWalking = visitor.phase === "arriving" || visitor.phase === "leaving";
    const facingTarget = isWalking ? visitor.destination : visitor.lookAt;
    if (facingTarget) {
      const directionX = facingTarget.x - visitor.position.x;
      const directionZ = facingTarget.z - visitor.position.z;
      if (Math.hypot(directionX, directionZ) > 0.01) {
        heading.current = Math.atan2(directionX, directionZ);
      }
    }
    const bounceSpeed = visitor.phase === "buying" ? 8.2 : isWalking ? 7.4 : 2.4;
    const bounceHeight = visitor.phase === "buying" ? 0.2 : isWalking ? 0.15 : 0.055;
    const bounce = Math.abs(Math.sin(time * bounceSpeed + bouncePhase));
    const landing = 1 - bounce;
    group.current.position.y = 0.61 + bounce * bounceHeight;
    group.current.rotation.y = heading.current;
    group.current.rotation.z = isWalking
      ? Math.sin(time * 5.1 + bouncePhase) * 0.055
      : 0;
    body.current?.scale.set(
      1 + landing * 0.045,
      1 - landing * 0.04,
      1 + landing * 0.045,
    );
    shadow.current?.scale.setScalar(1 - bounce * 0.16);
  });

  return (
    <group ref={group} position={[world.x, 0.61, world.z]}>
      <group ref={body}>
        <mesh castShadow>
          <sphereGeometry args={[VISITOR_RADIUS, 18, 14]} />
          <meshStandardMaterial color={visitor.color} roughness={0.82} />
        </mesh>
        <group position={[0, 0.075, 0.34]} renderOrder={2}>
          <mesh position={[-0.12, 0, 0.015]}>
            <sphereGeometry args={[0.052, 10, 8]} />
            <meshStandardMaterial color="#28323c" />
          </mesh>
          <mesh position={[0.12, 0, 0.015]}>
            <sphereGeometry args={[0.052, 10, 8]} />
            <meshStandardMaterial color="#28323c" />
          </mesh>
          <mesh position={[-0.105, 0.02, 0.06]}>
            <sphereGeometry args={[0.014, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.135, 0.02, 0.06]}>
            <sphereGeometry args={[0.014, 8, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        {visitor.phase === "buying" && <PurchaseMarker />}
        {visitor.phase === "leaving" && <TakeawayBag />}
      </group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, -0.53, 0]}>
        <circleGeometry args={[0.36, 16]} />
        <meshBasicMaterial color="#71877a" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
