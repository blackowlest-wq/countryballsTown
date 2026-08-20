export interface GameState {
  coins: number;
  wheat: number;
  wheatCrops: import("./Crop").WheatCrop[];
  villageLevel: number;
  residents: import("./Resident").Resident[];
  buildings: import("./Building").BuildingInstance[];
  unlockedCountries: string[];
  unlockedBuildings: string[];
  activeResidentRequest: import("./ResidentRequest").ActiveResidentRequest | null;
  nextResidentRequestAt: number;
  lastResidentRequestDefinitionId?: string;
  residentRequestDayKey: string;
  residentRequestsStartedToday: number;
  lastSavedAt: number;
}
