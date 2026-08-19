import { Shape } from "three";

const pizzaSliceShape = new Shape();
pizzaSliceShape.moveTo(-0.52, -0.36);
pizzaSliceShape.lineTo(0.52, -0.36);
pizzaSliceShape.quadraticCurveTo(0.28, 0.08, -0.06, 0.38);
pizzaSliceShape.quadraticCurveTo(-0.3, 0.46, -0.52, -0.36);

export function PizzaShop(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[2.35, 1.25, 1.35]} />
        <meshStandardMaterial color="#f3d6a3" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[2.52, 0.16, 1.48]} />
        <meshStandardMaterial color="#fff0d2" />
      </mesh>
      <group position={[0, 1.46, 0.02]}>
        <mesh position={[-0.66, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#5fa775" />
        </mesh>
        <mesh position={[-0.22, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#fffaf2" />
        </mesh>
        <mesh position={[0.22, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#e56558" />
        </mesh>
        <mesh position={[0.66, -0.1, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.04]} />
          <meshStandardMaterial color="#fffaf2" />
        </mesh>
      </group>
      <mesh position={[0, 1.77, 0.03]}>
        <boxGeometry args={[1.15, 0.34, 0.06]} />
        <meshStandardMaterial color="#fff5e5" />
      </mesh>
      <mesh position={[0, 1.78, 0.08]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 12]} />
        <meshStandardMaterial color="#e86a5b" />
      </mesh>
      <mesh position={[0, 1.58, -0.02]} rotation-x={-Math.PI / 2} castShadow>
        <extrudeGeometry
          args={[pizzaSliceShape, {
            depth: 0.08,
            bevelEnabled: true,
            bevelThickness: 0.025,
            bevelSize: 0.02,
            bevelSegments: 2,
          }]}
        />
        <meshStandardMaterial color="#f4b653" roughness={0.82} />
      </mesh>
      <group position={[0, 1.66, -0.02]}>
        <mesh position={[-0.18, 0, 0.08]}>
          <cylinderGeometry args={[0.075, 0.075, 0.028, 12]} />
          <meshStandardMaterial color="#df554b" roughness={0.7} />
        </mesh>
        <mesh position={[0.18, 0, 0.03]}>
          <cylinderGeometry args={[0.07, 0.07, 0.028, 12]} />
          <meshStandardMaterial color="#df554b" roughness={0.7} />
        </mesh>
        <mesh position={[0.03, 0, -0.2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.028, 12]} />
          <meshStandardMaterial color="#df554b" roughness={0.7} />
        </mesh>
      </group>
      <group position={[0, 1.72, 0.78]} rotation-x={Math.PI / 2}>
        <mesh castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.07, 24]} />
          <meshStandardMaterial color="#fff3d4" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <torusGeometry args={[0.3, 0.04, 8, 24]} />
          <meshStandardMaterial color="#e76755" roughness={0.7} />
        </mesh>
        <mesh position={[-0.13, 0.055, 0.11]}>
          <cylinderGeometry args={[0.075, 0.075, 0.025, 12]} />
          <meshStandardMaterial color="#df554b" roughness={0.7} />
        </mesh>
        <mesh position={[0.14, 0.055, 0.02]}>
          <cylinderGeometry args={[0.068, 0.068, 0.025, 12]} />
          <meshStandardMaterial color="#df554b" roughness={0.7} />
        </mesh>
        <mesh position={[-0.04, 0.055, -0.13]}>
          <cylinderGeometry args={[0.06, 0.06, 0.025, 12]} />
          <meshStandardMaterial color="#df554b" roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[-0.58, 0.62, 0.7]}>
        <boxGeometry args={[0.42, 0.62, 0.05]} />
        <meshStandardMaterial color="#72aecd" />
      </mesh>
      <mesh position={[0.52, 0.62, 0.7]}>
        <boxGeometry args={[0.42, 0.62, 0.05]} />
        <meshStandardMaterial color="#72aecd" />
      </mesh>
    </group>
  );
}
