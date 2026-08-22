export function Bakery(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.55, 1.1, 1.45]} />
        <meshStandardMaterial color="#f3d7a2" roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[2.7, 0.18, 1.58]} />
        <meshStandardMaterial color="#d77b54" roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.46, 0]} castShadow>
        <boxGeometry args={[2.35, 0.18, 1.32]} />
        <meshStandardMaterial color="#f6bd72" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.58, 0.75]}>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshStandardMaterial color="#91b5aa" roughness={0.48} />
      </mesh>
      <mesh position={[-0.82, 0.5, 0.76]}>
        <boxGeometry args={[0.36, 0.7, 0.04]} />
        <meshStandardMaterial color="#a96543" roughness={0.76} />
      </mesh>
      <mesh position={[0, 1.72, 0.77]} castShadow>
        <boxGeometry args={[0.92, 0.32, 0.08]} />
        <meshStandardMaterial color="#fff3d6" roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.74, 0.83]}>
        <sphereGeometry args={[0.18, 14, 10]} />
        <meshStandardMaterial color="#d49351" roughness={0.72} />
      </mesh>
    </group>
  );
}
