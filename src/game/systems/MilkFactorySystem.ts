import {
  MILK_FACTORY_INTERVAL_MS,
  MILK_FACTORY_MILK_COST,
  MILK_FACTORY_PRODUCT_AMOUNT,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type {
  MilkFactoryProduction,
  MilkFactoryProductType,
} from "../types/MilkFactory";
import type { GameState } from "../types/Village";
import { createFactoryProductionModule } from "./FactoryProductionSystem";

export type MilkFactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface MilkFactoryConfigurationResult {
  outcome: MilkFactoryConfigurationOutcome;
  state: GameState;
}

const milkFactoryProductionModule = createFactoryProductionModule<MilkFactoryProductType>({
  buildingId: "milk-factory",
  stateKey: "milkFactoryProductions",
  inputKey: "milk",
  inputAmount: MILK_FACTORY_MILK_COST,
  intervalMs: MILK_FACTORY_INTERVAL_MS,
  productAmount: MILK_FACTORY_PRODUCT_AMOUNT,
  products: [
    { type: "butter", outputKey: "butter" },
    { type: "cheese", outputKey: "cheese" },
  ],
});

export function getMilkFactoryProductName(productType: MilkFactoryProductType): string {
  return productType === "butter" ? "バター" : "チーズ";
}

export function isMilkFactoryProductType(value: unknown): value is MilkFactoryProductType {
  return milkFactoryProductionModule.isProductType(value);
}

export function registerMilkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return milkFactoryProductionModule.register(state, buildingInstanceId);
}

export function removeMilkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  return milkFactoryProductionModule.remove(state, buildingInstanceId);
}

export function configureMilkFactory(
  state: GameState,
  buildingInstanceId: string,
  productType: MilkFactoryProductType,
  now: number,
): MilkFactoryConfigurationResult {
  return milkFactoryProductionModule.configure(
    state,
    buildingInstanceId,
    productType,
    now,
  );
}

export function advanceMilkFactoryProductions(state: GameState, now: number): GameState {
  return milkFactoryProductionModule.advance(state, now);
}

export function normalizeMilkFactoryProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): MilkFactoryProduction[] {
  return milkFactoryProductionModule.normalize(value, buildings, now);
}
