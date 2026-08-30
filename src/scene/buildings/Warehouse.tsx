export function Warehouse(): JSX.Element {
  return (
    <group name="倉庫">
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[1.7, 1.16, 1.55]} />
        <meshStandardMaterial color="#c18a52" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.28, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.28, 0.5, 4]} />
        <meshStandardMaterial color="#8c5d3c" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.5, 0.8]}>
        <boxGeometry args={[0.55, 0.78, 0.05]} />
        <meshStandardMaterial color="#714934" roughness={0.78} />
      </mesh>
      <mesh position={[-0.56, 0.45, 0.82]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.3]} />
        <meshStandardMaterial color="#e0ae68" roughness={0.9} />
      </mesh>
      <mesh position={[0.56, 0.45, 0.82]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.3]} />
        <meshStandardMaterial color="#e0ae68" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.98, 0.82]}>
        <boxGeometry args={[1.1, 0.08, 0.05]} />
        <meshStandardMaterial color="#f0c47b" roughness={0.82} />
      </mesh>
    </group>
  );
}
