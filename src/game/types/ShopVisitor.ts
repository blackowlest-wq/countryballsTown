import type { GridPosition } from "./GridPosition";

export type ShopVisitorPhase = "arriving" | "waiting" | "buying" | "leaving";

export interface ShopVisitor {
  id: string;
  shopBuildingId: string;
  /** Country assigned when the visitor enters the village. */
  countryId?: string;
  color: string;
  position: GridPosition;
  destination: GridPosition;
  lookAt?: GridPosition;
  phase: ShopVisitorPhase;
  joinedAt: number;
  serviceUntil?: number;
}

export interface ShopVisitorSimulation {
  visitors: ShopVisitor[];
  nextArrivalAt: number;
  nextSequence: number;
}
