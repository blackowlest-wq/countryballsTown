export function Road(): JSX.Element {
  return (
    <group name="道路">
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, 0]} receiveShadow>
        <planeGeometry args={[0.96, 0.96]} />
        <meshStandardMaterial color="#b7a58d" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, 0]}>
        <planeGeometry args={[0.08, 0.72]} />
        <meshBasicMaterial color="#d9c7a4" />
      </mesh>
    </group>
  );
}
