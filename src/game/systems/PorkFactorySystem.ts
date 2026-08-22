import {
  PORK_FACTORY_INTERVAL_MS,
  PORK_FACTORY_PORK_COST,
  PORK_FACTORY_PRODUCT_AMOUNT,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type {
  PorkFactoryProduction,
  PorkFactoryProductType,
} from "../types/PorkFactory";
import type { GameState } from "../types/Village";
import { createFactoryProductionModule } from "./FactoryProductionSystem";

export type PorkFactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface PorkFactoryConfigurationResult {
  outcome: PorkFactoryConfigurationOutcome;
  state: GameState;
}

const porkFactoryProductionModule = createFactoryProductionModule<PorkFactoryProductType>({
  buildingId: "pork-factory",
  stateKey: "porkFactoryProductions",
  inputKey: "pork",
  inputAmount: PORK_FACTORY_PORK_COST,
  intervalMs: PORK_FACTORY_INTERVAL_MS,
  productAmount: PORK_FACTORY_PRODUCT_AMOUNT,
  products: [
    { type: "ham", outputKey: "ham" },
    { type: "sausage", outputKey: "sausage" },
    { type: "bacon", outputKey: "bacon" },
  ],
});

export function getPorkFactoryProductName(productType: PorkFactoryProductType): string {
  switch (productType) {
    case "ham":
      return "ハム";
    case "sausage":
      return "ソーセージ";
    case "bacon":
      return "ベーコン";
  }
}

export function isPorkFactoryProductType(value: unknown): value is PorkFactoryProductType {
  return porkFactoryProductionModule.isProductType(value);
}

export function registerPorkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return porkFactoryProductionModule.register(state, buildingInstanceId);
}

export function removePorkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return porkFactoryProductionModule.remove(state, buildingInstanceId);
}

export function configurePorkFactory(
  state: GameState,
  buildingInstanceId: string,
  productType: PorkFactoryProductType,
  now: number,
): PorkFactoryConfigurationResult {
  return porkFactoryProductionModule.configure(
    state,
    buildingInstanceId,
    productType,
    now,
  );
}

export function advancePorkFactoryProductions(state: GameState, now: number): GameState {
  return porkFactoryProductionModule.advance(state, now);
}

export function normalizePorkFactoryProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): PorkFactoryProduction[] {
  return porkFactoryProductionModule.normalize(value, buildings, now);
}
