export function StatueOfLiberty(): JSX.Element {
  return (
    <group name="自由の女神">
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.2, 8]} />
        <meshStandardMaterial color="#7d8f75" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <coneGeometry args={[0.27, 0.42, 8]} />
        <meshStandardMaterial color="#76a38d" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.86, 0]} scale={[0.62, 1.45, 0.62]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 0.58, 8]} />
        <meshStandardMaterial color="#76a38d" roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.31, 0]} castShadow>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#78a890" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.17, 0.28, 6]} />
        <meshStandardMaterial color="#76a38d" roughness={0.84} />
      </mesh>
      <mesh position={[0.28, 1.47, 0]} rotation-z={-0.85} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.64, 8]} />
        <meshStandardMaterial color="#76a38d" roughness={0.84} />
      </mesh>
      <mesh position={[0.49, 1.75, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.42, 8]} />
        <meshStandardMaterial color="#c59a4b" roughness={0.72} />
      </mesh>
      <mesh position={[0.49, 1.99, 0]} castShadow>
        <coneGeometry args={[0.1, 0.2, 6]} />
        <meshStandardMaterial color="#f3bd4f" emissive="#c78624" emissiveIntensity={0.18} roughness={0.7} />
      </mesh>
    </group>
  );
}
