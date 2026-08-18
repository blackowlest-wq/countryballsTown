import type { FlagPattern } from "../../game/types/Country";

export const CIRCLE_FLAG_CENTER_U = 0.25;
export type FlagTexturePattern = "solid" | "horizontal" | "vertical" | "circle";

export interface FlagPresentation {
  texturePattern: FlagTexturePattern;
  circleCenterU?: number;
}

export function getFlagPresentation(flagPattern: FlagPattern): FlagPresentation {
  if (flagPattern === "circle") {
    return {
      texturePattern: "circle",
      circleCenterU: CIRCLE_FLAG_CENTER_U,
    };
  }

  return {
    texturePattern: flagPattern,
  };
}
