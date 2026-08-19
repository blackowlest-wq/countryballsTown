import { Color, MeshStandardMaterial } from "three";
import type { FlagPattern } from "../../game/types/Country";
import {
  CIRCLE_CENTER_Y,
  CIRCLE_FRONT_Z,
  CIRCLE_RADIUS,
  VERTICAL_STRIPE_BOUNDARY,
} from "./flagPresentation";

const FLAG_PATTERN_INDEX: Record<FlagPattern, number> = {
  horizontal: 0,
  circle: 1,
  vertical: 2,
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
} else {
  countryBallFlagColor = vCountryBallPosition.x < -${toGlslNumber(VERTICAL_STRIPE_BOUNDARY)}
    ? uFlagColorA
    : vCountryBallPosition.x > ${toGlslNumber(VERTICAL_STRIPE_BOUNDARY)} ? uFlagColorC : uFlagColorB;
}
vec4 diffuseColor = vec4( countryBallFlagColor, opacity );`,
      );
  };

  material.customProgramCacheKey = () => `countryball-flag-${flagPattern}`;
  return material;
}
