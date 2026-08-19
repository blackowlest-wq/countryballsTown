import type { FlagPattern } from "../../game/types/Country";

export const FRONT_FLAG_Z = 0.43;
export type FlagTexturePattern = "solid" | "horizontal" | "vertical";
export type FrontFlagPattern = "circle" | "vertical";

export interface FlagPresentation {
  texturePattern: FlagTexturePattern;
  frontPattern?: FrontFlagPattern;
}

export function getFlagPresentation(flagPattern: FlagPattern): FlagPresentation {
  if (flagPattern === "circle" || flagPattern === "vertical") {
    return {
      texturePattern: "solid",
      frontPattern: flagPattern,
    };
  }

  return {
    texturePattern: flagPattern,
  };
}
