export interface CameraPanBasis {
  rightX: number;
  rightZ: number;
  upX: number;
  upZ: number;
}

export interface CameraPanDelta {
  x: number;
  z: number;
}

export function getGroundPanDelta(
  deltaX: number,
  deltaY: number,
  zoom: number,
  basis: CameraPanBasis,
): CameraPanDelta {
  const scale = 0.045 * (35 / zoom);
  const determinant = basis.rightX * basis.upZ - basis.rightZ * basis.upX;
  if (Math.abs(determinant) < 0.0001) {
    return {
      x: -deltaX * scale,
      z: deltaY * scale,
    };
  }

  const targetScreenX = -deltaX * scale;
  const targetScreenY = deltaY * scale;
  return {
    x:
      (targetScreenX * basis.upZ - basis.rightZ * targetScreenY) /
      determinant,
    z:
      (basis.rightX * targetScreenY - targetScreenX * basis.upX) /
      determinant,
  };
}
