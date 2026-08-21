export function Fence(): JSX.Element {
  const posts = [-0.42, 0.42];

  return (
    <group name="柵">
      {posts.flatMap((x) => posts.map((z) => (
        <group key={`${x}:${z}`} position={[x, 0.42, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.07, 0.84, 8]} />
            <meshStandardMaterial color="#805334" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.23, 0]} castShadow>
            <sphereGeometry args={[0.075, 8, 6]} />
            <meshStandardMaterial color="#9b6a41" roughness={0.85} />
          </mesh>
        </group>
      )))}
      {[-0.18, 0.18].flatMap((y) => (
        [
          <mesh key={`front:${y}`} position={[0, y + 0.38, 0.42]} castShadow>
            <boxGeometry args={[0.9, 0.07, 0.07]} />
            <meshStandardMaterial color="#9b6a41" roughness={0.9} />
          </mesh>,
          <mesh key={`back:${y}`} position={[0, y + 0.38, -0.42]} castShadow>
            <boxGeometry args={[0.9, 0.07, 0.07]} />
            <meshStandardMaterial color="#9b6a41" roughness={0.9} />
          </mesh>,
          <mesh key={`left:${y}`} position={[-0.42, y + 0.38, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, 0.9]} />
            <meshStandardMaterial color="#9b6a41" roughness={0.9} />
          </mesh>,
          <mesh key={`right:${y}`} position={[0.42, y + 0.38, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, 0.9]} />
            <meshStandardMaterial color="#9b6a41" roughness={0.9} />
          </mesh>,
        ]
      ))}
    </group>
  );
}
