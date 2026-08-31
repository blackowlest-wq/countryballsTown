import type { FlagPattern } from "../../game/types/Country";

export const BALL_RADIUS = 0.48;
export const VERTICAL_STRIPE_BOUNDARY = BALL_RADIUS / 3;
export const CIRCLE_CENTER_Y = 0.1;
export const CIRCLE_RADIUS = 0.28;
export const CIRCLE_FRONT_Z = 0.2;
export const USA_CANTON_LEFT_BOUNDARY = -0.1;
export const USA_CANTON_BOTTOM_BOUNDARY = 0.04;
export const USA_CANTON_FRONT_Z = 0.16;
export const USA_STRIPE_COUNT = 7;
export const USA_STRIPE_HEIGHT = (BALL_RADIUS * 2) / USA_STRIPE_COUNT;
export const CHINA_STAR_CENTER_X = -0.16;
export const CHINA_STAR_CENTER_Y = 0.16;
export const CHINA_STAR_FRONT_Z = 0.2;
export const CHINA_STAR_OUTER_RADIUS = 0.16;
export const CHINA_STAR_INNER_RADIUS = 0.055;

export interface FlagPresentation {
  texturePattern: FlagPattern;
  sphereSurface: true;
}

export interface SphereFlagPoint {
  x: number;
  y: number;
  z: number;
}

export function getFlagPresentation(flagPattern: FlagPattern): FlagPresentation {
  return {
    texturePattern: flagPattern,
    sphereSurface: true,
  };
}

export function isChinaStarPoint(point: SphereFlagPoint): boolean {
  if (point.z <= CHINA_STAR_FRONT_Z) return false;
  const offsetX = point.x - CHINA_STAR_CENTER_X;
  const offsetY = point.y - CHINA_STAR_CENTER_Y;
  const distance = Math.hypot(offsetX, offsetY);
  if (distance >= CHINA_STAR_OUTER_RADIUS) return false;
  const starBoundary =
    (CHINA_STAR_OUTER_RADIUS + CHINA_STAR_INNER_RADIUS) / 2
    + ((CHINA_STAR_OUTER_RADIUS - CHINA_STAR_INNER_RADIUS) / 2) * Math.cos(
      Math.atan2(offsetY, offsetX) * 5,
    );
  return distance < starBoundary;
}

export function getSphereFlagColorIndex(
  flagPattern: FlagPattern,
  point: SphereFlagPoint,
): 0 | 1 | 2 {
  if (flagPattern === "horizontal") return point.y > 0 ? 0 : 1;
  if (flagPattern === "circle") {
    const isFront = point.z > CIRCLE_FRONT_Z;
    const circleDistance = Math.hypot(point.x, point.y - CIRCLE_CENTER_Y);
    return isFront && circleDistance < CIRCLE_RADIUS ? 1 : 0;
  }
  if (flagPattern === "china-star") return isChinaStarPoint(point) ? 1 : 0;
  if (flagPattern === "canton-stripes") {
    const isCanton =
      point.z > USA_CANTON_FRONT_Z &&
      point.x < USA_CANTON_LEFT_BOUNDARY &&
      point.y > USA_CANTON_BOTTOM_BOUNDARY;
    if (isCanton) return 2;
    const stripeIndex = Math.min(
      USA_STRIPE_COUNT - 1,
      Math.max(0, Math.floor((point.y + BALL_RADIUS) / USA_STRIPE_HEIGHT)),
    );
    return stripeIndex % 2 === 0 ? 0 : 1;
  }
  if (point.x < -VERTICAL_STRIPE_BOUNDARY) return 0;
  if (point.x > VERTICAL_STRIPE_BOUNDARY) return 2;
  return 1;
}
