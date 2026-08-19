import type { FlagPattern } from "../../game/types/Country";

export const FRONT_FLAG_Z = 0.43;
export const FRONT_CIRCLE_SCALE = 0.36;
export const FRONT_VERTICAL_SCALE = 1.12;
export type FlagTexturePattern = "solid" | "horizontal" | "vertical";
export type FrontFlagPattern = "circle" | "vertical";

export interface FlagPresentation {
  texturePattern: FlagTexturePattern;
  frontPattern?: FrontFlagPattern;
  frontScale?: number;
}

export function getFlagPresentation(flagPattern: FlagPattern): FlagPresentation {
  if (flagPattern === "circle" || flagPattern === "vertical") {
    return {
      texturePattern: "solid",
      frontPattern: flagPattern,
      frontScale: flagPattern === "vertical" ? FRONT_VERTICAL_SCALE : FRONT_CIRCLE_SCALE,
    };
  }

  return {
    texturePattern: flagPattern,
  };
}
