export function ChineseRestaurant(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 1.5, 1.48]} />
        <meshStandardMaterial color="#ead7b6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[2.64, 0.18, 1.58]} />
        <meshStandardMaterial color="#cbb89d" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.8, 0.18, 1.72]} />
        <meshStandardMaterial color="#b9342f" roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.72, -0.02]} castShadow>
        <boxGeometry args={[2.58, 0.08, 1.5]} />
        <meshStandardMaterial color="#e4b64c" roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.98, 0.82]} castShadow>
        <boxGeometry args={[1.72, 0.46, 0.08]} />
        <meshStandardMaterial color="#b9342f" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.98, 0.875]}>
        <boxGeometry args={[1.42, 0.28, 0.025]} />
        <meshStandardMaterial color="#ffdf70" roughness={0.76} />
      </mesh>
      <mesh position={[-0.58, 0.76, 0.78]}>
        <boxGeometry args={[0.72, 0.64, 0.06]} />
        <meshStandardMaterial color="#b9342f" roughness={0.82} />
      </mesh>
      <mesh position={[-0.58, 0.76, 0.82]}>
        <boxGeometry args={[0.56, 0.48, 0.025]} />
        <meshStandardMaterial color="#a8d6d0" emissive="#5c9f96" emissiveIntensity={0.12} roughness={0.42} />
      </mesh>
      <mesh position={[0.48, 0.6, 0.8]} castShadow>
        <boxGeometry args={[0.58, 0.98, 0.1]} />
        <meshStandardMaterial color="#6c302e" roughness={0.9} />
      </mesh>
      <mesh position={[1.03, 0.98, 0.84]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.26, 8]} />
        <meshStandardMaterial color="#a66b43" roughness={0.92} />
      </mesh>
      <mesh position={[1.03, 1.2, 0.84]} castShadow>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#6e9d54" roughness={0.95} />
      </mesh>
      <mesh position={[-1.05, 1.06, 0.84]} castShadow>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#ffcf55" emissive="#e6a631" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}
