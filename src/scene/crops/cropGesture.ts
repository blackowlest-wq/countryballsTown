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
