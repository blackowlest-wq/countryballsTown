/** A compact stone workshop built from the village's mined materials. */
export function OreWorkshop(): JSX.Element {
  return (
    <group name="鉱石工房">
      <mesh position={[0, 0.43, 0]} castShadow>
        <boxGeometry args={[1.72, 0.86, 1.5]} />
        <meshStandardMaterial color="#777b86" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.94, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.25, 0.48, 4]} />
        <meshStandardMaterial color="#4e5665" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.43, 0.77]}>
        <boxGeometry args={[0.38, 0.66, 0.05]} />
        <meshStandardMaterial color="#373b45" roughness={0.72} />
      </mesh>
      <mesh position={[-0.5, 0.62, 0.77]}>
        <boxGeometry args={[0.28, 0.28, 0.04]} />
        <meshStandardMaterial color="#7bc2cf" emissive="#2c6873" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.5, 0.62, 0.77]}>
        <boxGeometry args={[0.28, 0.28, 0.04]} />
        <meshStandardMaterial color="#7bc2cf" emissive="#2c6873" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.55, 1.18, -0.26]} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.55, 8]} />
        <meshStandardMaterial color="#363c48" roughness={0.78} />
      </mesh>
      <mesh position={[0.55, 1.49, -0.26]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 8]} />
        <meshStandardMaterial color="#242933" roughness={0.76} />
      </mesh>
      <mesh position={[-0.65, 0.99, -0.38]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color="#77c6d6"
          emissive="#2f8a99"
          emissiveIntensity={0.5}
          roughness={0.34}
        />
      </mesh>
      <mesh position={[-0.42, 0.96, -0.38]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          color="#9b83d1"
          emissive="#5d3b9d"
          emissiveIntensity={0.4}
          roughness={0.36}
        />
      </mesh>
    </group>
  );
}
