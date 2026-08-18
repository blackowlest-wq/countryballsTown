export function Tree(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.21, 0.76, 8]} />
        <meshStandardMaterial color="#805237" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.62, 1.1, 8]} />
        <meshStandardMaterial color="#5f9e45" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.43, 0.8, 8]} />
        <meshStandardMaterial color="#76b64d" roughness={0.95} />
      </mesh>
    </group>
  );
}
