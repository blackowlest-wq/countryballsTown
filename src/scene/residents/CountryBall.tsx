import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { getCountryDefinition } from "../../game/data/countries";
import { getResidentMotion, type Resident } from "../../game/types/Resident";
import { useGameStore } from "../../store/gameStore";
import { gridToWorld } from "../../utils/grid";
import { BALL_RADIUS, getFlagPresentation } from "./flagPresentation";
import { ResidentMotionEffects } from "./ResidentMotionEffects";
import { ResidentRequestMarker } from "./ResidentRequestMarker";
import { createSphereFlagMaterial } from "./sphereFlagMaterial";

const DEFAULT_FLAG_COLORS = ["#fffaf2", "#9fb7d8"];

interface CountryBallProps {
  resident: Resident;
}

export function CountryBall({ resident }: CountryBallProps): JSX.Element {
  const group = useRef<Group>(null);
  const ballGroup = useRef<Group>(null);
  const motionEffectsGroup = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const heading = useRef(0);
  const selectResident = useGameStore((store) => store.selectResident);
  const interactionMode = useGameStore((store) => store.interactionMode);
  const hasActiveRequest = useGameStore(
    (store) => store.game.activeResidentRequest?.residentId === resident.id,
  );
  const country = getCountryDefinition(resident.countryId);
  const colors = country?.flagColors ?? DEFAULT_FLAG_COLORS;
  const flagPattern = country?.flagPattern ?? "horizontal";
  const flagPresentation = getFlagPresentation(flagPattern);
  const motion = getResidentMotion(resident);
  const flagMaterial = useMemo(
    () => createSphereFlagMaterial(flagPresentation.texturePattern, colors),
    [country?.id, flagPresentation.texturePattern, colors],
  );
  const world = gridToWorld(resident.position);

  useEffect(() => {
    return () => {
      flagMaterial.dispose();
    };
  }, [flagMaterial]);
  const bouncePhase = Array.from(resident.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) * 0.17;
  const lastMotion = useRef(motion);
  const motionStartTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.elapsedTime;
    if (motionStartTime.current === null || lastMotion.current !== motion) {
      lastMotion.current = motion;
      motionStartTime.current = time;
    }
    const motionElapsed = Math.max(0, time - (motionStartTime.current ?? time));
    const isWalking = resident.state === "walking";
    const isAction = resident.state === "action";
    const isSleeping = motion === "sleeping";
    const isFalling = motion === "falling";
    const isHappy = motion === "happy";
    if (isWalking && resident.destination) {
      const directionX = resident.destination.x - resident.position.x;
      const directionZ = resident.destination.z - resident.position.z;
      if (Math.hypot(directionX, directionZ) > 0.01) {
        heading.current = Math.atan2(directionX, directionZ);
      }
    } else if (resident.lookAt) {
      const directionX = resident.lookAt.x - resident.position.x;
      const directionZ = resident.lookAt.z - resident.position.z;
      if (Math.hypot(directionX, directionZ) > 0.01) {
        heading.current = Math.atan2(directionX, directionZ);
      }
    }
    const bounceSpeed = isHappy ? 9.5 : isSleeping ? 1.25 : isAction ? 4.2 : isWalking ? 7.2 : 2.35;
    const bounce = Math.abs(Math.sin(time * bounceSpeed + bouncePhase));
    const bounceHeight = isHappy ? 0.34 : isSleeping ? 0.018 : isAction ? 0.26 : isWalking ? 0.2 : 0.09;
    const walkBob = isWalking ? Math.sin(time * 7.2 + bouncePhase) * 0.012 : 0;
    const landing = 1 - bounce;
    const fallProgress = Math.min(1, motionElapsed / 1.15);
    const fallAngle =
      motion === "falling" && resident.motionUntil === undefined
        ? 0.92
        : fallProgress < 0.4
          ? (fallProgress / 0.4) * 1.18
          : 1.18 * (1 - Math.min(1, (fallProgress - 0.4) / 0.6));
    group.current.position.y = isFalling
      ? 0.58 + bounce * 0.025
      : isSleeping
        ? 0.7 + bounce * bounceHeight
        : 0.72 + bounce * bounceHeight + walkBob;
    group.current.rotation.z = isFalling
      ? fallAngle
      : isWalking
      ? Math.sin(time * 4.8 + bouncePhase) * 0.06
      : isSleeping
        ? Math.sin(time * 1.2 + bouncePhase) * 0.018
        : isAction
          ? Math.sin(time * 3.4 + bouncePhase) * 0.035
          : 0;
    group.current.rotation.y = heading.current;
    if (motionEffectsGroup.current) {
      motionEffectsGroup.current.rotation.y = -heading.current;
    }
    const targetScale = isHappy
      ? 1.06 + Math.sin(time * 6) * 0.035
      : isSleeping
        ? 1.03
        : isFalling
          ? 1.05
          : isAction
            ? 1.08 + Math.sin(time * 4) * 0.04
            : 1;
    const squash = landing * (isSleeping ? 0.085 : isFalling ? 0.1 : isAction ? 0.055 : isWalking ? 0.05 : 0.035);
    ballGroup.current?.scale.set(
      targetScale + squash,
      targetScale - squash * 0.7,
      targetScale + squash,
    );
    shadow.current?.scale.setScalar(isFalling ? 1.08 : 1 - bounce * 0.18);
  });

  return (
    <group
      ref={group}
      position={[world.x, 0.72, world.z]}
      onClick={(event) => {
        if (interactionMode !== "inspect") return;
        event.stopPropagation();
        selectResident(resident.id);
      }}
      onPointerOver={(event) => {
        if (interactionMode !== "inspect") return;
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <group ref={ballGroup}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_RADIUS, 18, 14]} />
          <primitive object={flagMaterial} attach="material" />
        </mesh>
        <group position={[0, 0.1, 0.43]} renderOrder={2}>
          {motion === "sleeping" ? (
            <>
              <mesh position={[-0.15, 0, 0.02]} rotation-z={-0.18}>
                <boxGeometry args={[0.13, 0.025, 0.025]} />
                <meshStandardMaterial color="#28323c" />
              </mesh>
              <mesh position={[0.15, 0, 0.02]} rotation-z={0.18}>
                <boxGeometry args={[0.13, 0.025, 0.025]} />
                <meshStandardMaterial color="#28323c" />
              </mesh>
            </>
          ) : (
            <>
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
            </>
          )}
        </group>
        <group ref={motionEffectsGroup}>
          <ResidentMotionEffects motion={motion} />
          {hasActiveRequest && <ResidentRequestMarker />}
        </group>
      </group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, -0.64, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color="#71877a" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}
