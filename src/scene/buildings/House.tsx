import {
  HOUSE_BODY_CENTER_Y,
  HOUSE_BODY_HEIGHT,
  HOUSE_CHIMNEY_CENTER_Y,
  HOUSE_CHIMNEY_HEIGHT,
  HOUSE_CHIMNEY_X,
  HOUSE_CHIMNEY_Z,
  HOUSE_ROOF_CENTER_Y,
  HOUSE_ROOF_HEIGHT,
  HOUSE_ROOF_RADIUS,
} from "./houseGeometry";

export function House(): JSX.Element {
  return (
    <group>
      <mesh position={[0, HOUSE_BODY_CENTER_Y, 0]} castShadow>
        <boxGeometry args={[1.75, HOUSE_BODY_HEIGHT, 1.45]} />
        <meshStandardMaterial color="#fff4df" roughness={0.9} />
      </mesh>
      <mesh position={[0, HOUSE_ROOF_CENTER_Y, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[HOUSE_ROOF_RADIUS, HOUSE_ROOF_HEIGHT, 4]} />
        <meshStandardMaterial color="#dc684e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.58, 0.74]}>
        <boxGeometry args={[0.36, 0.65, 0.05]} />
        <meshStandardMaterial color="#9a624d" />
      </mesh>
      <mesh position={[-0.52, 0.92, 0.74]}>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#82b7c7" />
      </mesh>
      <mesh position={[0.52, 0.92, 0.74]}>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#82b7c7" />
      </mesh>
      <mesh position={[HOUSE_CHIMNEY_X, HOUSE_CHIMNEY_CENTER_Y, HOUSE_CHIMNEY_Z]}>
        <boxGeometry args={[0.16, HOUSE_CHIMNEY_HEIGHT, 0.16]} />
        <meshStandardMaterial color="#d4d0c5" />
      </mesh>
    </group>
  );
}
