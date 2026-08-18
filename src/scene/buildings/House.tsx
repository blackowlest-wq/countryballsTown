export function House(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.75, 1.45, 1.45]} />
        <meshStandardMaterial color="#fff4df" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.28, 0.9, 4]} />
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
      <mesh position={[0, 1.85, 0.03]}>
        <boxGeometry args={[0.16, 0.34, 0.16]} />
        <meshStandardMaterial color="#d4d0c5" />
      </mesh>
    </group>
  );
}
