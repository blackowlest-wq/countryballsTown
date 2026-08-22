import type { BuildingInstance } from "../types/Building";
import type { CowProduction } from "../types/Cow";
import type { ChickenProduction } from "../types/Chicken";
import type { MilkFactoryProduction } from "../types/MilkFactory";
import type { PigProduction } from "../types/Pig";
import type { PorkFactoryProduction } from "../types/PorkFactory";
import type { GameState } from "../types/Village";
import type { WheatFactoryProduction } from "../types/WheatFactory";
import {
  registerChickenProduction,
  removeChickenProduction,
  normalizeChickenProductions,
} from "./ChickenSystem";
import {
  registerCowProduction,
  removeCowProduction,
  normalizeCowProductions,
} from "./CowSystem";
import {
  advanceMilkFactoryProductions,
  normalizeMilkFactoryProductions,
  registerMilkFactoryProduction,
  removeMilkFactoryProduction,
} from "./MilkFactorySystem";
import {
  registerPigProduction,
  removePigProduction,
  normalizePigProductions,
} from "./PigSystem";
import {
  advancePorkFactoryProductions,
  normalizePorkFactoryProductions,
  registerPorkFactoryProduction,
  removePorkFactoryProduction,
} from "./PorkFactorySystem";
import {
  advanceWheatFactoryProductions,
  normalizeWheatFactoryProductions,
  registerWheatFactoryProduction,
  removeWheatFactoryProduction,
} from "./WheatFactorySystem";

export type ProductionBuildingId =
  | "cow"
  | "pig"
  | "chicken"
  | "milk-factory"
  | "pork-factory"
  | "wheat-factory";

export interface ProductionCollectionInput {
  cowProductions: unknown;
  pigProductions: unknown;
  chickenProductions: unknown;
  milkFactoryProductions: unknown;
  porkFactoryProductions: unknown;
  wheatFactoryProductions: unknown;
}

export interface NormalizedProductionCollections {
  cowProductions: CowProduction[];
  pigProductions: PigProduction[];
  chickenProductions: ChickenProduction[];
  milkFactoryProductions: MilkFactoryProduction[];
  porkFactoryProductions: PorkFactoryProduction[];
  wheatFactoryProductions: WheatFactoryProduction[];
}

type ProductionRegistration = (
  state: GameState,
  buildingInstanceId: string,
  now: number,
) => GameState;

type ProductionRemoval = (state: GameState, buildingInstanceId: string) => GameState;

const registerByBuildingId: Record<ProductionBuildingId, ProductionRegistration> = {
  cow: registerCowProduction,
  pig: registerPigProduction,
  chicken: registerChickenProduction,
  "milk-factory": (state, buildingInstanceId) =>
    registerMilkFactoryProduction(state, buildingInstanceId),
  "pork-factory": (state, buildingInstanceId) =>
    registerPorkFactoryProduction(state, buildingInstanceId),
  "wheat-factory": (state, buildingInstanceId) =>
    registerWheatFactoryProduction(state, buildingInstanceId),
};

const removeByBuildingId: Record<ProductionBuildingId, ProductionRemoval> = {
  cow: (state, buildingInstanceId) => removeCowProduction(state, buildingInstanceId),
  pig: (state, buildingInstanceId) => removePigProduction(state, buildingInstanceId),
  chicken: (state, buildingInstanceId) => removeChickenProduction(state, buildingInstanceId),
  "milk-factory": (state, buildingInstanceId) =>
    removeMilkFactoryProduction(state, buildingInstanceId),
  "pork-factory": (state, buildingInstanceId) =>
    removePorkFactoryProduction(state, buildingInstanceId),
  "wheat-factory": (state, buildingInstanceId) =>
    removeWheatFactoryProduction(state, buildingInstanceId),
};

function getProductionOperation(
  operations: Record<ProductionBuildingId, ProductionRegistration>,
  buildingId: string,
): ProductionRegistration | undefined {
  if (!Object.prototype.hasOwnProperty.call(operations, buildingId)) return undefined;
  return operations[buildingId as ProductionBuildingId];
}

function getProductionRemoval(
  buildingId: string,
): ProductionRemoval | undefined {
  if (!Object.prototype.hasOwnProperty.call(removeByBuildingId, buildingId)) return undefined;
  return removeByBuildingId[buildingId as ProductionBuildingId];
}

export function registerProductionForBuilding(
  state: GameState,
  buildingId: string,
  buildingInstanceId: string,
  now: number,
): GameState {
  return getProductionOperation(registerByBuildingId, buildingId)?.(
    state,
    buildingInstanceId,
    now,
  ) ?? state;
}

export function removeProductionForBuilding(
  state: GameState,
  buildingId: string,
  buildingInstanceId: string,
): GameState {
  return getProductionRemoval(buildingId)?.(state, buildingInstanceId) ?? state;
}

export function normalizeProductionCollections(
  input: ProductionCollectionInput,
  buildings: readonly BuildingInstance[],
  now: number,
): NormalizedProductionCollections {
  return {
    cowProductions: normalizeCowProductions(input.cowProductions, buildings, now),
    pigProductions: normalizePigProductions(input.pigProductions, buildings, now),
    chickenProductions: normalizeChickenProductions(input.chickenProductions, buildings, now),
    milkFactoryProductions: normalizeMilkFactoryProductions(
      input.milkFactoryProductions,
      buildings,
      now,
    ),
    porkFactoryProductions: normalizePorkFactoryProductions(
      input.porkFactoryProductions,
      buildings,
      now,
    ),
    wheatFactoryProductions: normalizeWheatFactoryProductions(
      input.wheatFactoryProductions,
      buildings,
      now,
    ),
  };
}

/**
 * Factory order is part of the game progression contract. Wheat consumes its
 * input first, then milk, then pork, matching the pre-registry pipeline.
 */
export function advanceFactoryProductions(state: GameState, now: number): GameState {
  const wheat = advanceWheatFactoryProductions(state, now);
  const milk = advanceMilkFactoryProductions(wheat, now);
  return advancePorkFactoryProductions(milk, now);
}
