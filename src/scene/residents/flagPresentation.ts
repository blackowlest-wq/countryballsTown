import type { FlagPattern } from "../../game/types/Country";

export const FRONT_CIRCLE_Z = 0.43;
export type FlagTexturePattern = "solid" | "horizontal" | "vertical";

export interface FlagPresentation {
  texturePattern: FlagTexturePattern;
  frontCircle: boolean;
}

export function getFlagPresentation(flagPattern: FlagPattern): FlagPresentation {
  if (flagPattern === "circle") {
    return {
      texturePattern: "solid",
      frontCircle: true,
    };
  }

  return {
    texturePattern: flagPattern,
    frontCircle: false,
  };
}
