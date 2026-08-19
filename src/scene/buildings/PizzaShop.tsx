import { Shape } from "three";

const pizzaSliceShape = new Shape();
pizzaSliceShape.moveTo(0, 0.36);
pizzaSliceShape.lineTo(-0.3, -0.28);
pizzaSliceShape.quadraticCurveTo(0, -0.36, 0.3, -0.28);
pizzaSliceShape.closePath();

interface LetterStrokeProps {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: number;
}

function LetterStroke({ position, size, rotation = 0 }: LetterStrokeProps): JSX.Element {
  return (
    <mesh position={position} rotation={[0, 0, rotation]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#6f4b37" roughness={0.86} />
    </mesh>
  );
}

function LetterP(): JSX.Element {
  return (
    <group>
      <LetterStroke position={[-0.07, 0, 0]} size={[0.055, 0.25, 0.035]} />
      <LetterStroke position={[0.01, 0.1, 0]} size={[0.16, 0.055, 0.035]} />
      <LetterStroke position={[0.01, 0.005, 0]} size={[0.15, 0.05, 0.035]} />
      <LetterStroke position={[0.08, 0.055, 0]} size={[0.05, 0.13, 0.035]} />
    </group>
  );
}

function LetterI(): JSX.Element {
  return (
    <group>
      <LetterStroke position={[0, 0.1, 0]} size={[0.15, 0.05, 0.035]} />
      <LetterStroke position={[0, 0, 0]} size={[0.055, 0.22, 0.035]} />
      <LetterStroke position={[0, -0.1, 0]} size={[0.15, 0.05, 0.035]} />
    </group>
  );
}

function LetterZ(): JSX.Element {
  return (
    <group>
      <LetterStroke position={[0, 0.1, 0]} size={[0.19, 0.05, 0.035]} />
      <LetterStroke position={[0, 0, 0]} size={[0.05, 0.25, 0.035]} rotation={0.72} />
      <LetterStroke position={[0, -0.1, 0]} size={[0.19, 0.05, 0.035]} />
    </group>
  );
}

function LetterA(): JSX.Element {
  return (
    <group>
      <LetterStroke position={[-0.055, 0, 0]} size={[0.05, 0.25, 0.035]} rotation={-0.28} />
      <LetterStroke position={[0.055, 0, 0]} size={[0.05, 0.25, 0.035]} rotation={0.28} />
      <LetterStroke position={[0, -0.015, 0]} size={[0.14, 0.045, 0.035]} />
    </group>
  );
}

function PizzaWordmark(): JSX.Element {
  return (
    <group position={[0, 1.94, 0.89]}>
      <group position={[-0.57, 0, 0]}><LetterP /></group>
      <group position={[-0.28, 0, 0]}><LetterI /></group>
      <group position={[0, 0, 0]}><LetterZ /></group>
      <group position={[0.31, 0, 0]}><LetterZ /></group>
      <group position={[0.62, 0, 0]}><LetterA /></group>
    </group>
  );
}

function PizzaSliceSign(): JSX.Element {
  return (
    <group position={[0, 2.5, 0.79]}>
      <mesh castShadow>
        <extrudeGeometry
          args={[
            pizzaSliceShape,
            {
              depth: 0.1,
              bevelEnabled: true,
              bevelThickness: 0.025,
              bevelSize: 0.02,
              bevelSegments: 2,
            },
          ]}
        />
        <meshStandardMaterial color="#f7d36e" roughness={0.82} />
      </mesh>
      <mesh position={[0, -0.29, 0.11]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.59, 10]} />
        <meshStandardMaterial color="#d98a48" roughness={0.88} />
      </mesh>
      <mesh position={[-0.1, 0.02, 0.12]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.055, 0.055, 0.035, 10]} />
        <meshStandardMaterial color="#d95d4f" roughness={0.78} />
      </mesh>
      <mesh position={[0.11, -0.12, 0.12]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.035, 10]} />
        <meshStandardMaterial color="#d95d4f" roughness={0.78} />
      </mesh>
      <mesh position={[0.04, 0.16, 0.12]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.045, 0.045, 0.035, 10]} />
        <meshStandardMaterial color="#dc6653" roughness={0.78} />
      </mesh>
      <mesh position={[-0.02, -0.09, 0.13]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.03, 8]} />
        <meshStandardMaterial color="#63995e" roughness={0.8} />
      </mesh>
    </group>
  );
}

const awningStripeColors = ["#dc604e", "#fff5df", "#dc604e", "#fff5df", "#dc604e"];

function StripedAwning(): JSX.Element {
  return (
    <group>
      <mesh position={[-0.34, 1.31, 0.79]} castShadow>
        <boxGeometry args={[1.72, 0.13, 0.13]} />
        <meshStandardMaterial color="#cc5948" roughness={0.85} />
      </mesh>
      <group position={[-0.34, 1.25, 0.82]} rotation-x={0.2}>
        {awningStripeColors.map((color, index) => (
          <mesh key={`${color}-${index}`} position={[(index - 2) * 0.34, 0, 0.28]} castShadow>
            <boxGeometry args={[0.335, 0.075, 0.58]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        ))}
      </group>
      <group position={[-0.34, 1.09, 1.39]}>
        {awningStripeColors.map((color, index) => (
          <mesh key={`${color}-valance-${index}`} position={[(index - 2) * 0.34, 0, 0]} castShadow>
            <boxGeometry args={[0.335, 0.2, 0.075]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FrontWindow(): JSX.Element {
  return (
    <group position={[-0.69, 0.72, 0.785]}>
      <mesh>
        <boxGeometry args={[0.72, 0.62, 0.075]} />
        <meshStandardMaterial color="#7b543e" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[0.59, 0.49, 0.035]} />
        <meshStandardMaterial
          color="#f6c864"
          emissive="#e9a849"
          emissiveIntensity={0.18}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[0.045, 0.5, 0.025]} />
        <meshStandardMaterial color="#8b5d43" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[0.6, 0.045, 0.025]} />
        <meshStandardMaterial color="#8b5d43" roughness={0.85} />
      </mesh>
    </group>
  );
}

function FrontDoor(): JSX.Element {
  return (
    <group position={[0.48, 0.52, 0.795]}>
      <mesh>
        <boxGeometry args={[0.58, 0.98, 0.1]} />
        <meshStandardMaterial color="#7c513b" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.015, 0.065]}>
        <boxGeometry args={[0.45, 0.85, 0.055]} />
        <meshStandardMaterial color="#5d9b69" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.2, 0.1]}>
        <boxGeometry args={[0.31, 0.26, 0.02]} />
        <meshStandardMaterial color="#9ac4b5" roughness={0.35} />
      </mesh>
      <mesh position={[0.15, -0.17, 0.12]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial color="#efbd52" metalness={0.15} roughness={0.48} />
      </mesh>
    </group>
  );
}

function WallLantern(): JSX.Element {
  return (
    <group position={[1.02, 0.93, 0.83]}>
      <mesh position={[0, 0.23, -0.04]}>
        <boxGeometry args={[0.08, 0.08, 0.18]} />
        <meshStandardMaterial color="#655043" roughness={0.9} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.16, 0.25, 0.09]} />
        <meshStandardMaterial
          color="#ffd86b"
          emissive="#f0ad42"
          emissiveIntensity={0.32}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0.15, 0.025]}>
        <boxGeometry args={[0.24, 0.055, 0.14]} />
        <meshStandardMaterial color="#655043" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.15, 0.025]}>
        <boxGeometry args={[0.22, 0.055, 0.14]} />
        <meshStandardMaterial color="#655043" roughness={0.9} />
      </mesh>
      <mesh position={[-0.1, 0, 0.025]}>
        <boxGeometry args={[0.045, 0.29, 0.13]} />
        <meshStandardMaterial color="#655043" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0, 0.025]}>
        <boxGeometry args={[0.045, 0.29, 0.13]} />
        <meshStandardMaterial color="#655043" roughness={0.9} />
      </mesh>
    </group>
  );
}

function PottedHerb(): JSX.Element {
  return (
    <group position={[1.03, 0, 1.02]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.26, 8]} />
        <meshStandardMaterial color="#c86a4b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#76a950" roughness={0.95} />
      </mesh>
      <mesh position={[-0.08, 0.42, 0.02]} castShadow>
        <dodecahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#84b85b" roughness={0.95} />
      </mesh>
      <mesh position={[0.08, 0.43, -0.015]} castShadow>
        <dodecahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#6f9f49" roughness={0.95} />
      </mesh>
    </group>
  );
}

export function PizzaShop(): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.81, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 1.55, 1.5]} />
        <meshStandardMaterial color="#f1dfb9" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[2.62, 0.18, 1.57]} />
        <meshStandardMaterial color="#ded1b7" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.61, -0.01]} castShadow>
        <boxGeometry args={[2.78, 0.18, 1.72]} />
        <meshStandardMaterial color="#d86d4e" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.72, -0.04]} castShadow>
        <boxGeometry args={[2.58, 0.08, 1.48]} />
        <meshStandardMaterial color="#f3dfb7" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.94, 0.67]} castShadow>
        <boxGeometry args={[2.12, 0.62, 0.32]} />
        <meshStandardMaterial color="#d46b4d" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.94, 0.855]}>
        <boxGeometry args={[1.85, 0.42, 0.075]} />
        <meshStandardMaterial color="#f5e4bf" roughness={0.9} />
      </mesh>
      <PizzaWordmark />
      <PizzaSliceSign />

      <FrontWindow />
      <FrontDoor />
      <StripedAwning />
      <WallLantern />
      <PottedHerb />

      <mesh position={[0.48, 0.055, 1.02]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.11, 0.42]} />
        <meshStandardMaterial color="#d7cbb9" roughness={0.98} />
      </mesh>
    </group>
  );
}
