export type CropType = "wheat" | "tomato";

export interface Crop {
  type: CropType;
  gridX: number;
  gridY: number;
  plantedAt: number;
}
