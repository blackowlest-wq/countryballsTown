export const HOUSE_BODY_CENTER_Y = 0.75;
export const HOUSE_BODY_HEIGHT = 1.45;
export const HOUSE_BODY_TOP_Y = HOUSE_BODY_CENTER_Y + HOUSE_BODY_HEIGHT / 2;

export const HOUSE_ROOF_RADIUS = 1.28;
export const HOUSE_ROOF_HEIGHT = 0.9;
export const HOUSE_ROOF_CLEARANCE = 0.02;
export const HOUSE_ROOF_BASE_Y = HOUSE_BODY_TOP_Y + HOUSE_ROOF_CLEARANCE;
export const HOUSE_ROOF_CENTER_Y = HOUSE_ROOF_BASE_Y + HOUSE_ROOF_HEIGHT / 2;

export const HOUSE_CHIMNEY_X = 0.45;
export const HOUSE_CHIMNEY_Z = -0.25;
export const HOUSE_CHIMNEY_HEIGHT = 0.34;
export const HOUSE_CHIMNEY_CENTER_Y = 2.14;
export const HOUSE_CHIMNEY_BOTTOM_Y = HOUSE_CHIMNEY_CENTER_Y - HOUSE_CHIMNEY_HEIGHT / 2;

const HOUSE_ROOF_HALF_EXTENT = HOUSE_ROOF_RADIUS / Math.sqrt(2);

export function getHouseRoofSurfaceY(x: number, z: number): number {
  const distanceFromPeak = Math.max(Math.abs(x), Math.abs(z));
  const slope = Math.min(distanceFromPeak / HOUSE_ROOF_HALF_EXTENT, 1);
  return HOUSE_ROOF_BASE_Y + HOUSE_ROOF_HEIGHT * (1 - slope);
}
