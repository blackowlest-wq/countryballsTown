export function PizzaShop(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[2.35, 1.25, 1.35]} />
        <meshStandardMaterial color="#f3d6a3" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[2.52, 0.16, 1.48]} />
        <meshStandardMaterial color="#fff0d2" />
      </mesh>
      <group position={[0, 1.46, 0.02]}>
        <mesh position={[-0.66, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#5fa775" />
        </mesh>
        <mesh position={[-0.22, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#fffaf2" />
        </mesh>
        <mesh position={[0.22, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#e56558" />
        </mesh>
        <mesh position={[0.66, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#fffaf2" />
        </mesh>
      </group>
      <mesh position={[0, 1.77, 0.03]}>
        <boxGeometry args={[1.15, 0.34, 0.06]} />
        <meshStandardMaterial color="#fff5e5" />
      </mesh>
      <mesh position={[0, 1.78, 0.08]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 12]} />
        <meshStandardMaterial color="#e86a5b" />
      </mesh>
      <mesh position={[-0.58, 0.62, 0.7]}>
        <boxGeometry args={[0.42, 0.62, 0.05]} />
        <meshStandardMaterial color="#72aecd" />
      </mesh>
      <mesh position={[0.52, 0.62, 0.7]}>
        <boxGeometry args={[0.42, 0.62, 0.05]} />
        <meshStandardMaterial color="#72aecd" />
      </mesh>
    </group>
  );
}
