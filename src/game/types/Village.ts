export interface GameState {
  coins: number;
  wheatSeeds: number;
  wheat: number;
  tomatoSeeds: number;
  tomatoes: number;
  crops: import("./Crop").Crop[];
  milk: number;
  butter: number;
  cheese: number;
  cowProductions: import("./Cow").CowProduction[];
  milkFactoryProductions: import("./MilkFactory").MilkFactoryProduction[];
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
