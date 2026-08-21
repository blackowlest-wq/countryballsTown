import { useRef } from "react";
import { GRID_SIZE } from "../game/constants/gameConstants";
import { isCropMature } from "../game/systems/CropSystem";
import { useGameStore } from "../store/gameStore";
import { worldToGrid } from "../utils/grid";
import {
  beginHarvestGesture,
  endHarvestGesture,
  isHarvestGestureActive,
} from "./crops/harvestGesture";

type CropGestureMode = "plant" | "harvest";

function hasMatureCropAt(gridX: number, gridY: number): boolean {
  const crop = useGameStore.getState().game.crops.find(
    (candidate) => candidate.gridX === gridX && candidate.gridY === gridY,
  );
  return crop ? isCropMature(crop, Date.now()) : false;
}

export function Ground(): JSX.Element {
  const interactionMode = useGameStore((store) => store.interactionMode);
  const placeSelectedBuilding = useGameStore((store) => store.placeSelectedBuilding);
  const moveSelectedBuilding = useGameStore((store) => store.moveSelectedBuilding);
  const interactCrop = useGameStore((store) => store.interactCrop);
  const harvestCrop = useGameStore((store) => store.harvestCrop);
  const activePointers = useRef(new Set<number>());
  const visitedCells = useRef(new Map<number, Set<string>>());
  const gestureModes = useRef(new Map<number, CropGestureMode>());

  const finishCropGesture = (pointerId: number): void => {
    activePointers.current.delete(pointerId);
    visitedCells.current.delete(pointerId);
    gestureModes.current.delete(pointerId);
    endHarvestGesture(pointerId);
  };

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, -0.08, 0]}
      receiveShadow
      onPointerDown={(event) => {
        if (interactionMode !== "farm" && interactionMode !== "inspect") return;
        const cell = worldToGrid(event.point.x, event.point.z);
        const startsWithHarvest = hasMatureCropAt(cell.x, cell.z);
        if (interactionMode !== "farm" && !startsWithHarvest) return;
        event.stopPropagation();
        activePointers.current.add(event.pointerId);
        visitedCells.current.set(event.pointerId, new Set());
        const mode: CropGestureMode = startsWithHarvest || isHarvestGestureActive(event.pointerId)
          ? "harvest"
          : "plant";
        gestureModes.current.set(event.pointerId, mode);
        if (mode === "harvest") beginHarvestGesture(event.pointerId);
        const target = event.nativeEvent.target;
        if (target instanceof Element) target.setPointerCapture(event.pointerId);
        if (activePointers.current.size !== 1) return;
        const key = `${cell.x}:${cell.z}`;
        visitedCells.current.get(event.pointerId)?.add(key);
        if (mode === "harvest") {
          harvestCrop(cell.x, cell.z);
        } else {
          interactCrop(cell.x, cell.z);
        }
      }}
      onPointerMove={(event) => {
        if (
          (interactionMode !== "farm" && interactionMode !== "inspect") ||
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
        const currentMode = gestureModes.current.get(event.pointerId) ?? "plant";
        if (currentMode === "plant" && (
          isHarvestGestureActive(event.pointerId) ||
          hasMatureCropAt(cell.x, cell.z)
        )) {
          gestureModes.current.set(event.pointerId, "harvest");
          beginHarvestGesture(event.pointerId);
        }
        if (gestureModes.current.get(event.pointerId) === "harvest") {
          if (hasMatureCropAt(cell.x, cell.z)) harvestCrop(cell.x, cell.z);
        } else {
          interactCrop(cell.x, cell.z);
        }
      }}
      onPointerUp={(event) => {
        if (!activePointers.current.has(event.pointerId)) return;
        event.stopPropagation();
        const target = event.nativeEvent.target;
        if (target instanceof Element && target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId);
        }
        finishCropGesture(event.pointerId);
      }}
      onPointerCancel={(event) => finishCropGesture(event.pointerId)}
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
