const blossomClusters: Array<{
  position: [number, number, number];
  scale: number;
  color: string;
}> = [
  { position: [-0.34, 1.15, 0.02], scale: 0.92, color: "#f3a9bf" },
  { position: [0, 1.38, -0.04], scale: 1, color: "#f7bfd0" },
  { position: [0.34, 1.16, 0.03], scale: 0.9, color: "#efa0ba" },
  { position: [-0.05, 1.12, 0.3], scale: 0.82, color: "#f8cada" },
];

export function CherryTree(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.43, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 0.86, 8]} />
        <meshStandardMaterial color="#80523e" roughness={0.95} />
      </mesh>
      <mesh position={[-0.16, 0.84, 0]} rotation-z={-0.62} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.5, 7]} />
        <meshStandardMaterial color="#8a5942" roughness={0.95} />
      </mesh>
      <mesh position={[0.17, 0.86, 0.02]} rotation-z={0.65} castShadow>
        <cylinderGeometry args={[0.055, 0.085, 0.48, 7]} />
        <meshStandardMaterial color="#8a5942" roughness={0.95} />
      </mesh>
      {blossomClusters.map((cluster, index) => (
        <mesh
          key={`${cluster.position.join("-")}-${index}`}
          position={cluster.position}
          scale={cluster.scale}
          castShadow
        >
          <sphereGeometry args={[0.42, 8, 6]} />
          <meshStandardMaterial color={cluster.color} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}
