function FishDisplay({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}): JSX.Element {
  return (
    <group position={position} rotation-y={-0.2}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0.2, 0, 0]} rotation-z={-Math.PI / 2} castShadow>
        <coneGeometry args={[0.13, 0.28, 4]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>
      <mesh position={[-0.04, 0.09, 0]} rotation-z={0.25}>
        <coneGeometry args={[0.07, 0.18, 3]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>
      <mesh position={[0.08, 0.03, 0.14]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color="#fff8df" roughness={0.45} />
      </mesh>
    </group>
  );
}

function FishShopSign(): JSX.Element {
  return (
    <group position={[0, 1.94, 0.84]}>
      <mesh castShadow>
        <boxGeometry args={[1.55, 0.5, 0.08]} />
        <meshStandardMaterial color="#315f70" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[1.3, 0.31, 0.025]} />
        <meshStandardMaterial color="#f5e6be" roughness={0.82} />
      </mesh>
      <group position={[0, 0, 0.075]} scale={0.7}>
        <FishDisplay position={[-0.38, 0, 0]} color="#e98978" />
        <FishDisplay position={[0.38, 0, 0]} color="#6da8ba" />
      </group>
    </group>
  );
}

function FishShopAwning(): JSX.Element {
  const colors = ["#4f8d9b", "#f5e6be", "#4f8d9b", "#f5e6be", "#4f8d9b"];
  return (
    <group position={[-0.32, 1.31, 0.82]} rotation-x={0.2}>
      {colors.map((color, index) => (
        <mesh key={`${color}-${index}`} position={[(index - 2) * 0.34, 0, 0.28]} castShadow>
          <boxGeometry args={[0.335, 0.075, 0.58]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function FishShop(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.81, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 1.55, 1.5]} />
        <meshStandardMaterial color="#d9e5d8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[2.62, 0.18, 1.57]} />
        <meshStandardMaterial color="#c7d2c7" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.61, -0.01]} castShadow>
        <boxGeometry args={[2.78, 0.18, 1.72]} />
        <meshStandardMaterial color="#4f8d9b" roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.72, -0.04]} castShadow>
        <boxGeometry args={[2.58, 0.08, 1.48]} />
        <meshStandardMaterial color="#d8e7df" roughness={0.9} />
      </mesh>

      <FishShopSign />
      <FishShopAwning />

      <mesh position={[-0.7, 0.72, 0.78]}>
        <boxGeometry args={[0.78, 0.62, 0.06]} />
        <meshStandardMaterial color="#315f70" roughness={0.84} />
      </mesh>
      <mesh position={[-0.7, 0.72, 0.82]}>
        <boxGeometry args={[0.62, 0.47, 0.025]} />
        <meshStandardMaterial color="#b9e0e0" emissive="#6ca9aa" emissiveIntensity={0.12} roughness={0.42} />
      </mesh>
      <mesh position={[0.48, 0.55, 0.8]} castShadow>
        <boxGeometry args={[0.6, 0.95, 0.1]} />
        <meshStandardMaterial color="#315f70" roughness={0.9} />
      </mesh>
      <mesh position={[1.02, 0.35, 0.83]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.32, 10]} />
        <meshStandardMaterial color="#b88152" roughness={0.92} />
      </mesh>
      <mesh position={[1.02, 0.68, 0.83]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 10]} />
        <meshStandardMaterial color="#7d9a82" roughness={0.85} />
      </mesh>
      <FishDisplay position={[-0.12, 0.98, 0.86]} color="#e98978" />
      <FishDisplay position={[0.34, 1.03, 0.87]} color="#6da8ba" />
    </group>
  );
}
