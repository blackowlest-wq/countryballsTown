import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import {
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ZOOM,
} from "../game/constants/gameConstants";

interface PointerPosition {
  x: number;
  y: number;
}

export function CameraController(): null {
  const { camera, gl } = useThree();
  const target = useRef({ x: 0, z: 0 });
  const pointers = useRef(new Map<number, PointerPosition>());
  const lastPinchDistance = useRef<number | null>(null);

  useEffect(() => {
    const activeCamera = camera as OrthographicCamera;
    const element = gl.domElement;

    const updateCamera = (): void => {
      activeCamera.position.set(target.current.x + 14, 18, target.current.z + 14);
      activeCamera.lookAt(target.current.x, 0, target.current.z);
      activeCamera.updateProjectionMatrix();
    };

    const zoomBy = (amount: number): void => {
      activeCamera.zoom = Math.min(
        CAMERA_MAX_ZOOM,
        Math.max(CAMERA_MIN_ZOOM, activeCamera.zoom + amount),
      );
      updateCamera();
    };

    const panBy = (deltaX: number, deltaY: number): void => {
      const scale = 0.045 * (35 / activeCamera.zoom);
      target.current.x = Math.max(-7, Math.min(7, target.current.x - deltaX * scale));
      target.current.z = Math.max(-7, Math.min(7, target.current.z + deltaY * scale));
      updateCamera();
    };

    const pinchDistance = (): number | null => {
      const values = [...pointers.current.values()];
      if (values.length < 2) return null;
      return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    };

    const onPointerDown = (event: PointerEvent): void => {
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size === 2) lastPinchDistance.current = pinchDistance();
    };

    const onPointerMove = (event: PointerEvent): void => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size >= 2) {
        const nextDistance = pinchDistance();
        if (nextDistance !== null && lastPinchDistance.current !== null) {
          zoomBy((nextDistance - lastPinchDistance.current) * 0.055);
        }
        lastPinchDistance.current = nextDistance;
        return;
      }
      panBy(event.clientX - previous.x, event.clientY - previous.y);
    };

    const onPointerUp = (event: PointerEvent): void => {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) lastPinchDistance.current = null;
    };

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      zoomBy(-event.deltaY * 0.018);
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: false });
    updateCamera();

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("wheel", onWheel);
    };
  }, [camera, gl]);

  return null;
}
