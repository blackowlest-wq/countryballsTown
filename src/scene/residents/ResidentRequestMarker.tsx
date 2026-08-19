import { Shape } from "three";

const speechBubbleShape = new Shape();
speechBubbleShape.moveTo(-0.25, -0.17);
speechBubbleShape.quadraticCurveTo(-0.31, -0.17, -0.31, -0.1);
speechBubbleShape.lineTo(-0.31, 0.14);
speechBubbleShape.quadraticCurveTo(-0.31, 0.22, -0.23, 0.22);
speechBubbleShape.lineTo(0.23, 0.22);
speechBubbleShape.quadraticCurveTo(0.31, 0.22, 0.31, 0.14);
speechBubbleShape.lineTo(0.31, -0.1);
speechBubbleShape.quadraticCurveTo(0.31, -0.17, 0.23, -0.17);
speechBubbleShape.lineTo(-0.07, -0.17);
speechBubbleShape.lineTo(-0.18, -0.29);
speechBubbleShape.lineTo(-0.17, -0.17);
speechBubbleShape.closePath();

export function ResidentRequestMarker(): JSX.Element {
  return (
    <group position={[0, 0.93, 0.12]} rotation-y={Math.PI / 4}>
      <mesh>
        <shapeGeometry args={[speechBubbleShape]} />
        <meshBasicMaterial color="#fffaf0" side={2} transparent opacity={0.96} />
      </mesh>
      <mesh position={[0, 0.045, 0.012]}>
        <boxGeometry args={[0.055, 0.17, 0.025]} />
        <meshBasicMaterial color="#e7a038" />
      </mesh>
      <mesh position={[0, -0.075, 0.012]}>
        <sphereGeometry args={[0.034, 8, 6]} />
        <meshBasicMaterial color="#e7a038" />
      </mesh>
    </group>
  );
}
