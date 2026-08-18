import type { GridPosition } from "./GridPosition";

export type ResidentState = "idle" | "walking" | "action";

export interface Resident {
  id: string;
  countryId: string;
  position: GridPosition;
  state: ResidentState;
  destination?: GridPosition;
  actionBuildingId?: string;
  actionUntil?: number;
  nextDecisionAt?: number;
}
