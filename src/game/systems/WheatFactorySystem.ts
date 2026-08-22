import {
  WHEAT_FACTORY_INTERVAL_MS,
  WHEAT_FACTORY_PRODUCT_AMOUNT,
  WHEAT_FACTORY_WHEAT_COST,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type {
  WheatFactoryProduction,
  WheatFactoryProductType,
} from "../types/WheatFactory";
import type { GameState } from "../types/Village";
import { createFactoryProductionModule } from "./FactoryProductionSystem";

export type WheatFactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface WheatFactoryConfigurationResult {
  outcome: WheatFactoryConfigurationOutcome;
  state: GameState;
}

const wheatFactoryProductionModule = createFactoryProductionModule<WheatFactoryProductType>({
  buildingId: "wheat-factory",
  stateKey: "wheatFactoryProductions",
  inputKey: "wheat",
  inputAmount: WHEAT_FACTORY_WHEAT_COST,
  intervalMs: WHEAT_FACTORY_INTERVAL_MS,
  productAmount: WHEAT_FACTORY_PRODUCT_AMOUNT,
  products: [{ type: "wheat-flour", outputKey: "wheatFlour" }],
});

export function getWheatFactoryProductName(_productType: WheatFactoryProductType): string {
  return "小麦粉";
}

export function isWheatFactoryProductType(value: unknown): value is WheatFactoryProductType {
  return wheatFactoryProductionModule.isProductType(value);
}

export function registerWheatFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return wheatFactoryProductionModule.register(state, buildingInstanceId);
}

export function removeWheatFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return wheatFactoryProductionModule.remove(state, buildingInstanceId);
}

export function configureWheatFactory(
  state: GameState,
  buildingInstanceId: string,
  productType: WheatFactoryProductType,
  now: number,
): WheatFactoryConfigurationResult {
  return wheatFactoryProductionModule.configure(
    state,
    buildingInstanceId,
    productType,
    now,
  );
}

export function advanceWheatFactoryProductions(state: GameState, now: number): GameState {
  return wheatFactoryProductionModule.advance(state, now);
}

export function normalizeWheatFactoryProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): WheatFactoryProduction[] {
  return wheatFactoryProductionModule.normalize(value, buildings, now);
}
