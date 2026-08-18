import { GRID_SIZE } from "../game/constants/gameConstants";
import { useGameStore } from "../store/gameStore";
import { worldToGrid } from "../utils/grid";

export function Ground(): JSX.Element {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const placeSelectedBuilding = useGameStore((store) => store.placeSelectedBuilding);
  const moveSelectedBuilding = useGameStore((store) => store.moveSelectedBuilding);

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, -0.08, 0]}
      receiveShadow
      onClick={(event) => {
        if (interactionMode === "inspect") return;
        event.stopPropagation();
        const cell = worldToGrid(event.point.x, event.point.z);
        if (interactionMode === "build") placeSelectedBuilding(cell.x, cell.z);
        if (interactionMode === "move") moveSelectedBuilding(cell.x, cell.z);
      }}
    >
      <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
      <meshStandardMaterial color="#a8cd78" roughness={1} />
    </mesh>
  );
}
