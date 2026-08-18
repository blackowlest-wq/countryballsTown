export function Fountain(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 0.98, 0.28, 12]} />
        <meshStandardMaterial color="#d7c9ac" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.68, 0.72, 0.18, 12]} />
        <meshStandardMaterial color="#6fc3d5" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.24, 0.52, 8]} />
        <meshStandardMaterial color="#d7c9ac" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.4, 0.28, 0.16, 12]} />
        <meshStandardMaterial color="#d7c9ac" />
      </mesh>
      <mesh position={[0, 1.06, 0]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#6fc3d5" />
      </mesh>
    </group>
  );
}
