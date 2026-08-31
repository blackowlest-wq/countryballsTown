import { Color, MeshStandardMaterial } from "three";
import type { FlagPattern } from "../../game/types/Country";
import {
  BALL_RADIUS,
  CHINA_STAR_CENTER_X,
  CHINA_STAR_CENTER_Y,
  CHINA_STAR_FRONT_Z,
  CHINA_STAR_INNER_RADIUS,
  CHINA_STAR_OUTER_RADIUS,
  CIRCLE_CENTER_Y,
  CIRCLE_FRONT_Z,
  CIRCLE_RADIUS,
  USA_CANTON_BOTTOM_BOUNDARY,
  USA_CANTON_FRONT_Z,
  USA_CANTON_LEFT_BOUNDARY,
  USA_STRIPE_COUNT,
  USA_STRIPE_HEIGHT,
  VERTICAL_STRIPE_BOUNDARY,
} from "./flagPresentation";

const FLAG_PATTERN_INDEX: Record<FlagPattern, number> = {
  horizontal: 0,
  circle: 1,
  vertical: 2,
  "canton-stripes": 3,
  "china-star": 4,
};

function toGlslNumber(value: number): string {
  return value.toFixed(4);
}

export function createSphereFlagMaterial(
  flagPattern: FlagPattern,
  colors: string[],
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 });
  const colorA = new Color(colors[0] ?? "#fffaf2");
  const colorB = new Color(colors[1] ?? colors[0] ?? "#fffaf2");
  const colorC = new Color(colors[2] ?? colors[1] ?? colors[0] ?? "#fffaf2");

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCountryBallPattern = { value: FLAG_PATTERN_INDEX[flagPattern] };
    shader.uniforms.uFlagColorA = { value: colorA };
    shader.uniforms.uFlagColorB = { value: colorB };
    shader.uniforms.uFlagColorC = { value: colorC };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vCountryBallPosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCountryBallPosition = position;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vCountryBallPosition;
uniform int uCountryBallPattern;
uniform vec3 uFlagColorA;
uniform vec3 uFlagColorB;
uniform vec3 uFlagColorC;`,
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `vec3 countryBallFlagColor = uFlagColorA;
if (uCountryBallPattern == 0) {
  countryBallFlagColor = vCountryBallPosition.y > 0.0 ? uFlagColorA : uFlagColorB;
} else if (uCountryBallPattern == 1) {
  float circleDistance = distance(vCountryBallPosition.xy, vec2(0.0, ${toGlslNumber(CIRCLE_CENTER_Y)}));
  bool isFront = vCountryBallPosition.z > ${toGlslNumber(CIRCLE_FRONT_Z)};
  countryBallFlagColor = isFront && circleDistance < ${toGlslNumber(CIRCLE_RADIUS)} ? uFlagColorB : uFlagColorA;
} else if (uCountryBallPattern == 2) {
  countryBallFlagColor = vCountryBallPosition.x < -${toGlslNumber(VERTICAL_STRIPE_BOUNDARY)}
    ? uFlagColorA
    : vCountryBallPosition.x > ${toGlslNumber(VERTICAL_STRIPE_BOUNDARY)} ? uFlagColorC : uFlagColorB;
} else if (uCountryBallPattern == 3) {
  bool isCanton = vCountryBallPosition.z > ${toGlslNumber(USA_CANTON_FRONT_Z)}
    && vCountryBallPosition.x < ${toGlslNumber(USA_CANTON_LEFT_BOUNDARY)}
    && vCountryBallPosition.y > ${toGlslNumber(USA_CANTON_BOTTOM_BOUNDARY)};
  float stripeIndex = min(${toGlslNumber(USA_STRIPE_COUNT - 1)}, max(0.0,
    floor((vCountryBallPosition.y + ${toGlslNumber(BALL_RADIUS)}) / ${toGlslNumber(USA_STRIPE_HEIGHT)})));
  countryBallFlagColor = isCanton
    ? uFlagColorC
    : mod(stripeIndex, 2.0) < 1.0 ? uFlagColorA : uFlagColorB;
} else if (uCountryBallPattern == 4) {
  vec2 starOffset = vCountryBallPosition.xy - vec2(
    ${toGlslNumber(CHINA_STAR_CENTER_X)},
    ${toGlslNumber(CHINA_STAR_CENTER_Y)}
  );
  float starDistance = length(starOffset);
  float starAngle = atan(starOffset.y, starOffset.x);
  float starBoundary = (${toGlslNumber(CHINA_STAR_OUTER_RADIUS)} + ${toGlslNumber(CHINA_STAR_INNER_RADIUS)}) / 2.0
    + (${toGlslNumber(CHINA_STAR_OUTER_RADIUS)} - ${toGlslNumber(CHINA_STAR_INNER_RADIUS)}) / 2.0
      * cos(starAngle * 5.0);
  bool isStar = vCountryBallPosition.z > ${toGlslNumber(CHINA_STAR_FRONT_Z)}
    && starDistance < starBoundary;
  countryBallFlagColor = isStar ? uFlagColorB : uFlagColorA;
} else {
  countryBallFlagColor = uFlagColorA;
}
vec4 diffuseColor = vec4( countryBallFlagColor, opacity );`,
      );
  };

  material.customProgramCacheKey = () => `countryball-flag-${flagPattern}`;
  return material;
}
