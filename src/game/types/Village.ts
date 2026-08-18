export interface GameState {
  coins: number;
  villageLevel: number;
  residents: import("./Resident").Resident[];
  buildings: import("./Building").BuildingInstance[];
  unlockedCountries: string[];
  unlockedBuildings: string[];
  lastSavedAt: number;
}
