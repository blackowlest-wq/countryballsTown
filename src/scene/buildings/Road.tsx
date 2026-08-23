export function Road(): JSX.Element {
  return (
    <group name="道路">
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, 0]} receiveShadow>
        <planeGeometry args={[0.96, 0.96]} />
        <meshStandardMaterial color="#b7a58d" roughness={1} />
      </mesh>
    </group>
  );
}
