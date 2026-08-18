export function Torii(): JSX.Element {
  return (
    <group>
      <mesh position={[-0.34, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 1.45, 8]} />
        <meshStandardMaterial color="#d95242" />
      </mesh>
      <mesh position={[0.34, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 1.45, 8]} />
        <meshStandardMaterial color="#d95242" />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <boxGeometry args={[1, 0.14, 0.18]} />
        <meshStandardMaterial color="#d95242" />
      </mesh>
      <mesh position={[0, 1.49, 0]} rotation={[0, 0, Math.PI / 80]} castShadow>
        <boxGeometry args={[1.18, 0.13, 0.22]} />
        <meshStandardMaterial color="#463b3b" />
      </mesh>
    </group>
  );
}
