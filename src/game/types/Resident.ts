import type { GridPosition } from "./GridPosition";

export type ResidentState = "idle" | "walking" | "action";
export type ResidentMotion =
  | "idle"
  | "look-tree"
  | "look-fountain"
  | "approach-resident"
  | "use-building"
  | "happy"
  | "sleeping"
  | "falling"
  | "talking"
  | "heart";

export interface Resident {
  id: string;
  countryId: string;
  position: GridPosition;
  state: ResidentState;
  destination?: GridPosition;
  actionBuildingId?: string;
  actionUntil?: number;
  nextDecisionAt?: number;
  motion?: ResidentMotion;
  motionStartedAt?: number;
  motionUntil?: number;
  lookAt?: GridPosition;
  targetResidentId?: string;
}

export function getResidentMotion(resident: Resident): ResidentMotion {
  if (resident.motion) return resident.motion;
  return resident.state === "action" ? "use-building" : "idle";
}
