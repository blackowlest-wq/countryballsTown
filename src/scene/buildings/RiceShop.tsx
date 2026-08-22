function RiceShopSign(): JSX.Element {
  return (
    <group position={[0, 1.95, 0.84]}>
      <mesh castShadow>
        <boxGeometry args={[1.38, 0.48, 0.08]} />
        <meshStandardMaterial color="#315b62" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[1.15, 0.3, 0.025]} />
        <meshStandardMaterial color="#f4e5bc" roughness={0.82} />
      </mesh>
      <mesh position={[-0.31, 0, 0.075]}>
        <boxGeometry args={[0.08, 0.25, 0.025]} />
        <meshStandardMaterial color="#315b62" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0, 0.075]}>
        <boxGeometry args={[0.08, 0.25, 0.025]} />
        <meshStandardMaterial color="#315b62" roughness={0.82} />
      </mesh>
      <mesh position={[0.31, 0, 0.075]}>
        <boxGeometry args={[0.08, 0.25, 0.025]} />
        <meshStandardMaterial color="#315b62" roughness={0.82} />
      </mesh>
    </group>
  );
}

function RiceShopNoren(): JSX.Element {
  return (
    <group position={[0.38, 1.3, 0.78]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.35, 0.1, 0.12]} />
        <meshStandardMaterial color="#315b62" roughness={0.78} />
      </mesh>
      {[-0.5, -0.17, 0.17, 0.5].map((x) => (
        <mesh key={x} position={[x, -0.07, 0.02]} castShadow>
          <boxGeometry args={[0.29, 0.48, 0.08]} />
          <meshStandardMaterial color="#4f8d8b" roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function RiceShopWindow(): JSX.Element {
  return (
    <group position={[-0.78, 0.72, 0.76]}>
      <mesh>
        <boxGeometry args={[0.7, 0.62, 0.06]} />
        <meshStandardMaterial color="#315b62" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.58, 0.48, 0.025]} />
        <meshStandardMaterial
          color="#b8dfd5"
          emissive="#6fa99b"
          emissiveIntensity={0.14}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.04, 0.49, 0.02]} />
        <meshStandardMaterial color="#315b62" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.59, 0.04, 0.02]} />
        <meshStandardMaterial color="#315b62" roughness={0.84} />
      </mesh>
    </group>
  );
}

export function RiceShop(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 1.52, 1.45]} />
        <meshStandardMaterial color="#eee0bd" roughness={0.91} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[2.62, 0.18, 1.54]} />
        <meshStandardMaterial color="#d2c7ac" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.78, 0.18, 1.7]} />
        <meshStandardMaterial color="#477d78" roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.71, -0.03]} castShadow>
        <boxGeometry args={[2.58, 0.08, 1.47]} />
        <meshStandardMaterial color="#7fae9b" roughness={0.88} />
      </mesh>
      <RiceShopSign />
      <RiceShopNoren />
      <RiceShopWindow />

      <mesh position={[0.5, 0.56, 0.78]} castShadow>
        <boxGeometry args={[0.54, 0.98, 0.09]} />
        <meshStandardMaterial color="#315b62" roughness={0.88} />
      </mesh>
      <mesh position={[0.5, 0.75, 0.84]}>
        <boxGeometry args={[0.33, 0.25, 0.025]} />
        <meshStandardMaterial color="#b8dfd5" roughness={0.45} />
      </mesh>
      <mesh position={[0.7, 0.54, 0.86]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial color="#e8b855" metalness={0.1} roughness={0.5} />
      </mesh>

      <mesh position={[1.02, 0.94, 0.82]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.27, 8]} />
        <meshStandardMaterial color="#b56e4f" roughness={0.9} />
      </mesh>
      <mesh position={[1.02, 1.18, 0.82]} castShadow>
        <dodecahedronGeometry args={[0.17, 0]} />
        <meshStandardMaterial color="#6ea15e" roughness={0.95} />
      </mesh>
    </group>
  );
}
