export function GreatWall(): JSX.Element {
  const crenellationPositions = [-1.1, -0.55, 0, 0.55, 1.1];

  return (
    <group name="万里の長城">
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.75, 0.55, 0.62]} />
        <meshStandardMaterial color="#c99358" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[2.86, 0.1, 0.72]} />
        <meshStandardMaterial color="#e0b16d" roughness={0.9} />
      </mesh>
      {crenellationPositions.map((x) => (
        <mesh key={x} position={[x, 0.78, 0]} castShadow>
          <boxGeometry args={[0.22, 0.28, 0.66]} />
          <meshStandardMaterial color="#c99358" roughness={0.94} />
        </mesh>
      ))}
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[x, 0.48, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.92, 0.84]} />
            <meshStandardMaterial color="#b97d49" roughness={0.94} />
          </mesh>
          <mesh position={[0, 0.52, 0]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.96]} />
            <meshStandardMaterial color="#e0b16d" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
