export function BurgerShop(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 1.5, 1.48]} />
        <meshStandardMaterial color="#f1d29a" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[2.64, 0.18, 1.58]} />
        <meshStandardMaterial color="#d2b987" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.8, 0.18, 1.72]} />
        <meshStandardMaterial color="#3c3b6e" roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.72, -0.02]} castShadow>
        <boxGeometry args={[2.58, 0.08, 1.5]} />
        <meshStandardMaterial color="#f4e4bd" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.98, 0.82]} castShadow>
        <boxGeometry args={[1.84, 0.5, 0.08]} />
        <meshStandardMaterial color="#b22234" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.98, 0.875]}>
        <boxGeometry args={[1.5, 0.3, 0.025]} />
        <meshStandardMaterial color="#fff0c9" roughness={0.76} />
      </mesh>
      <group position={[0, 1.98, 0.905]}>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.06, 12]} />
          <meshStandardMaterial color="#e4a743" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <cylinderGeometry args={[0.32, 0.32, 0.07, 12]} />
          <meshStandardMaterial color="#75a552" roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.08, 12]} />
          <meshStandardMaterial color="#7f4b31" roughness={0.86} />
        </mesh>
      </group>
      <mesh position={[-0.58, 0.76, 0.78]}>
        <boxGeometry args={[0.72, 0.64, 0.06]} />
        <meshStandardMaterial color="#3c3b6e" roughness={0.82} />
      </mesh>
      <mesh position={[-0.58, 0.76, 0.82]}>
        <boxGeometry args={[0.56, 0.48, 0.025]} />
        <meshStandardMaterial color="#a8d9e0" emissive="#5d9eb0" emissiveIntensity={0.12} roughness={0.42} />
      </mesh>
      <mesh position={[0.48, 0.6, 0.8]} castShadow>
        <boxGeometry args={[0.58, 0.98, 0.1]} />
        <meshStandardMaterial color="#8a4430" roughness={0.9} />
      </mesh>
      <mesh position={[1.03, 1.02, 0.84]} castShadow>
        <cylinderGeometry args={[0.14, 0.12, 0.28, 10]} />
        <meshStandardMaterial color="#f0dfb3" roughness={0.85} />
      </mesh>
      <mesh position={[1.03, 1.25, 0.84]} castShadow>
        <coneGeometry args={[0.18, 0.22, 8]} />
        <meshStandardMaterial color="#b22234" roughness={0.84} />
      </mesh>
    </group>
  );
}
