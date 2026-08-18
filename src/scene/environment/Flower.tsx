export function Flower(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.34, 6]} />
        <meshStandardMaterial color="#55a565" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshStandardMaterial color="#f7adbd" />
      </mesh>
      <mesh position={[0, 0.39, 0.1]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color="#ffe6a3" />
      </mesh>
    </group>
  );
}
