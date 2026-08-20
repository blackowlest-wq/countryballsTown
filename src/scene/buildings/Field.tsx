const FURROW_OFFSETS = [-0.24, 0, 0.24] as const;

export function Field(): JSX.Element {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[0.94, 0.1, 0.94]} />
        <meshStandardMaterial color="#79502f" roughness={1} />
      </mesh>
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[0.78, 0.06, 0.78]} />
        <meshStandardMaterial color="#9b6a3e" roughness={1} />
      </mesh>
      {FURROW_OFFSETS.map((offset) => (
        <mesh key={offset} position={[offset, 0.085, 0]} receiveShadow>
          <boxGeometry args={[0.1, 0.035, 0.68]} />
          <meshStandardMaterial color="#6f472c" roughness={1} />
        </mesh>
      ))}
      <mesh position={[-0.45, 0.09, 0]} castShadow>
        <boxGeometry args={[0.07, 0.1, 0.96]} />
        <meshStandardMaterial color="#b07a45" roughness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.09, 0]} castShadow>
        <boxGeometry args={[0.07, 0.1, 0.96]} />
        <meshStandardMaterial color="#b07a45" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.09, -0.45]} castShadow>
        <boxGeometry args={[0.84, 0.1, 0.07]} />
        <meshStandardMaterial color="#b07a45" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.09, 0.45]} castShadow>
        <boxGeometry args={[0.84, 0.1, 0.07]} />
        <meshStandardMaterial color="#b07a45" roughness={0.9} />
      </mesh>
    </group>
  );
}
