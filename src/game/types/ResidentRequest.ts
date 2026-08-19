export type ResidentRequestGoal =
  | {
      type: "building-count";
      buildingIds: string[];
      target: number;
      progressLabel: string;
    }
  | {
      type: "earn-coins";
      target: number;
      progressLabel: string;
    };

export interface ResidentRequestDefinition {
  id: string;
  countryId: string;
  message: string;
  goal: ResidentRequestGoal;
  rewardCoins: number;
}

export interface ActiveResidentRequest {
  definitionId: string;
  residentId: string;
  progress: number;
  startedAt: number;
}
