export type FlagLayout = "horizontal" | "vertical";
export type FlagPattern = "horizontal" | "circle" | "vertical" | "canton-stripes";

export interface CountryDefinition {
  id: string;
  name: string;
  flagEmoji: string;
  flagTexture: string;
  flagColors: string[];
  flagLayout: FlagLayout;
  flagPattern: FlagPattern;
  favoriteBuildingIds: string[];
  unlockedBuildingIds: string[];
  accentColor: string;
}
