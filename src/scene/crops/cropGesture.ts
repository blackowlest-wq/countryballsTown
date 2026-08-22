import { isCellInField } from "../../game/systems/CropSystem";
import type { BuildingInstance } from "../../game/types/Building";

export type CropInteractionMode = "inspect" | "farm";

export interface CropGestureCell {
  x: number;
  z: number;
}

export function shouldStartCropGesture(
  interactionMode: CropInteractionMode,
  buildings: readonly BuildingInstance[],
  cell: CropGestureCell,
  startsWithHarvest: boolean,
): boolean {
  if (interactionMode !== "inspect" && interactionMode !== "farm") return false;
  if (startsWithHarvest) return true;
  return interactionMode === "farm" && isCellInField(buildings, cell.x, cell.z);
}

const activeCropPointers = new Set<number>();

export function beginCropGesture(pointerId: number): void {
  activeCropPointers.add(pointerId);
}

export function isCropGestureActive(pointerId: number): boolean {
  return activeCropPointers.has(pointerId);
}

export function hasActiveCropGesture(): boolean {
  return activeCropPointers.size > 0;
}

export function endCropGesture(pointerId: number): void {
  activeCropPointers.delete(pointerId);
}
