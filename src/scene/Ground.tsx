import { useRef } from "react";
import { GRID_SIZE } from "../game/constants/gameConstants";
import { useGameStore } from "../store/gameStore";
import { worldToGrid } from "../utils/grid";

export function Ground(): JSX.Element {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const placeSelectedBuilding = useGameStore((store) => store.placeSelectedBuilding);
  const moveSelectedBuilding = useGameStore((store) => store.moveSelectedBuilding);
  const interactWheat = useGameStore((store) => store.interactWheat);
  const activePointers = useRef(new Set<number>());
  const visitedCells = useRef(new Map<number, Set<string>>());

  const finishFarmGesture = (pointerId: number): void => {
    activePointers.current.delete(pointerId);
    visitedCells.current.delete(pointerId);
  };

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, -0.08, 0]}
      receiveShadow
      onPointerDown={(event) => {
        if (interactionMode !== "farm") return;
        event.stopPropagation();
        activePointers.current.add(event.pointerId);
        visitedCells.current.set(event.pointerId, new Set());
        const target = event.nativeEvent.target;
        if (target instanceof Element) target.setPointerCapture(event.pointerId);
        if (activePointers.current.size !== 1) return;
        const cell = worldToGrid(event.point.x, event.point.z);
        const key = `${cell.x}:${cell.z}`;
        visitedCells.current.get(event.pointerId)?.add(key);
        interactWheat(cell.x, cell.z);
      }}
      onPointerMove={(event) => {
        if (
          interactionMode !== "farm" ||
          !activePointers.current.has(event.pointerId) ||
          activePointers.current.size !== 1
        ) {
          return;
        }
        event.stopPropagation();
        const cell = worldToGrid(event.point.x, event.point.z);
        const key = `${cell.x}:${cell.z}`;
        const visited = visitedCells.current.get(event.pointerId);
        if (!visited || visited.has(key)) return;
        visited.add(key);
        interactWheat(cell.x, cell.z);
      }}
      onPointerUp={(event) => {
        if (interactionMode !== "farm") return;
        event.stopPropagation();
        const target = event.nativeEvent.target;
        if (target instanceof Element && target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId);
        }
        finishFarmGesture(event.pointerId);
      }}
      onPointerCancel={(event) => finishFarmGesture(event.pointerId)}
      onClick={(event) => {
        if (interactionMode === "inspect" || interactionMode === "farm") return;
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
