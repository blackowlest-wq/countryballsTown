const activeHarvestPointers = new Set<number>();

export function beginHarvestGesture(pointerId: number): void {
  activeHarvestPointers.add(pointerId);
}

export function isHarvestGestureActive(pointerId: number): boolean {
  return activeHarvestPointers.has(pointerId);
}

export function hasActiveHarvestGesture(): boolean {
  return activeHarvestPointers.size > 0;
}

export function endHarvestGesture(pointerId: number): void {
  activeHarvestPointers.delete(pointerId);
}
