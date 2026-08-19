import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Group, Mesh } from "three";
import { getCountryDefinition } from "../../game/data/countries";
import type { Resident } from "../../game/types/Resident";
import { useGameStore } from "../../store/gameStore";
import { gridToWorld } from "../../utils/grid";
import { FRONT_CIRCLE_SCALE, FRONT_FLAG_Z, getFlagPresentation } from "./flagPresentation";

const DEFAULT_FLAG_COLORS = ["#fffaf2", "#9fb7d8"];

interface CountryBallProps {
  resident: Resident;
}

export function CountryBall({ resident }: CountryBallProps): JSX.Element {
  const group = useRef<Group>(null);
  const ballGroup = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const heading = useRef(0);
  const selectResident = useGameStore((store) => store.selectResident);
  const country = getCountryDefinition(resident.countryId);
  const colors = country?.flagColors ?? DEFAULT_FLAG_COLORS;
  const flagPattern = country?.flagPattern ?? "horizontal";
  const flagPresentation = getFlagPresentation(flagPattern);
  const frontFlagScale = flagPresentation.frontScale ?? FRONT_CIRCLE_SCALE;
  const world = gridToWorld(resident.position);
  const flagTexture = useMemo(() => {
    if (typeof document === "undefined") return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const first = colors[0] ?? "#fffaf2";
    const second = colors[1] ?? first;
    context.fillStyle = flagPresentation.frontPattern ? "#fffaf2" : first;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (flagPresentation.texturePattern === "vertical") {
      const stripeWidth = canvas.width / 3;
      colors.slice(0, 3).forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(index * stripeWidth, 0, stripeWidth + 1, canvas.height);
      });
    } else if (flagPresentation.texturePattern === "horizontal") {
      context.fillStyle = second;
      context.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [country?.id, flagPresentation.texturePattern, colors]);

  const frontFlagTexture = useMemo(() => {
    const frontPattern = flagPresentation.frontPattern;
    if (!frontPattern || typeof document === "undefined") return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    context.save();
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, 108, 0, Math.PI * 2);
    context.clip();
    if (frontPattern === "circle") {
      context.fillStyle = colors[1] ?? "#ed5a67";
      context.fill();
    } else {
      const stripeWidth = canvas.width / 3;
      colors.slice(0, 3).forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(index * stripeWidth, 0, stripeWidth + 1, canvas.height);
      });
    }
    context.restore();

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [country?.id, flagPresentation.frontPattern, colors]);

  useEffect(() => {
    return () => {
      flagTexture?.dispose();
      frontFlagTexture?.dispose();
    };
  }, [flagTexture, frontFlagTexture]);
  const bouncePhase = Array.from(resident.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) * 0.17;

  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = clock.elapsedTime;
    const isWalking = resident.state === "walking";
    const isAction = resident.state === "action";
    if (isWalking && resident.destination) {
      const directionX = resident.destination.x - resident.position.x;
      const directionZ = resident.destination.z - resident.position.z;
      if (Math.hypot(directionX, directionZ) > 0.01) {
        heading.current = Math.atan2(directionX, directionZ);
      }
    }
    const bounceSpeed = isAction ? 4.2 : isWalking ? 7.2 : 2.35;
    const bounce = Math.abs(Math.sin(time * bounceSpeed + bouncePhase));
    const bounceHeight = isAction ? 0.26 : isWalking ? 0.2 : 0.09;
    const walkBob = isWalking ? Math.sin(time * 7.2 + bouncePhase) * 0.012 : 0;
    const landing = 1 - bounce;
    group.current.position.y = 0.72 + bounce * bounceHeight + walkBob;
    group.current.rotation.z = isWalking
      ? Math.sin(time * 4.8 + bouncePhase) * 0.06
      : 0;
    group.current.rotation.y = heading.current;
    const targetScale = isAction ? 1.08 + Math.sin(time * 4) * 0.04 : 1;
    const squash = landing * (isAction ? 0.055 : isWalking ? 0.05 : 0.035);
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
          <meshStandardMaterial map={flagTexture} color="#ffffff" roughness={0.8} />
        </mesh>
        {flagPresentation.frontPattern && frontFlagTexture && (
          <sprite
            position={[0, 0.1, FRONT_FLAG_Z]}
            scale={[frontFlagScale, frontFlagScale, 1]}
            renderOrder={1}
          >
            <spriteMaterial
              map={frontFlagTexture}
              alphaTest={0.5}
              transparent={false}
              depthTest={false}
              depthWrite={false}
            />
          </sprite>
        )}
        <group position={[0, 0.1, 0.43]} renderOrder={2}>
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
