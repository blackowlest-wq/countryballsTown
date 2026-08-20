export interface GameState {
  coins: number;
  wheatSeeds: number;
  wheat: number;
  wheatCrops: import("./Crop").WheatCrop[];
  milk: number;
  cowProductions: import("./Cow").CowProduction[];
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
