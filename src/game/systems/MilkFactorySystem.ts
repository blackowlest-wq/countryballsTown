import {
  MILK_FACTORY_INTERVAL_MS,
  MILK_FACTORY_MILK_COST,
  MILK_FACTORY_PRODUCT_AMOUNT,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { GameState } from "../types/Village";
import type {
  MilkFactoryProduction,
  MilkFactoryProductType,
} from "../types/MilkFactory";

export type MilkFactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface MilkFactoryConfigurationResult {
  outcome: MilkFactoryConfigurationOutcome;
  state: GameState;
}

export function getMilkFactoryProductName(productType: MilkFactoryProductType): string {
  return productType === "butter" ? "バター" : "チーズ";
}

export function isMilkFactoryProductType(value: unknown): value is MilkFactoryProductType {
  return value === "butter" || value === "cheese";
}

export function registerMilkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  if (state.milkFactoryProductions.some(
    (production) => production.buildingInstanceId === buildingInstanceId,
  )) {
    return state;
  }
  return {
    ...state,
    milkFactoryProductions: [
      ...state.milkFactoryProductions,
      { buildingInstanceId, productType: null, nextProductionAt: null },
    ],
  };
}

export function removeMilkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  const productions = state.milkFactoryProductions.filter(
    (production) => production.buildingInstanceId !== buildingInstanceId,
  );
  return productions.length === state.milkFactoryProductions.length
    ? state
    : { ...state, milkFactoryProductions: productions };
}

export function configureMilkFactory(
  state: GameState,
  buildingInstanceId: string,
  productType: MilkFactoryProductType,
  now: number,
): MilkFactoryConfigurationResult {
  if (!isMilkFactoryProductType(productType)) {
    return { outcome: "invalid-product", state };
  }
  const index = state.milkFactoryProductions.findIndex(
    (production) => production.buildingInstanceId === buildingInstanceId,
  );
  if (index < 0) return { outcome: "not-found", state };

  return {
    outcome: "configured",
    state: {
      ...state,
      milkFactoryProductions: state.milkFactoryProductions.map((production, productionIndex) =>
        productionIndex === index
          ? {
            ...production,
            productType,
            nextProductionAt: now + MILK_FACTORY_INTERVAL_MS,
          }
          : production
      ),
    },
  };
}

export function advanceMilkFactoryProductions(state: GameState, now: number): GameState {
  let milk = state.milk;
  let butter = state.butter;
  let cheese = state.cheese;
  let changed = false;
  const productions = state.milkFactoryProductions.map((production) => {
    if (!production.productType || production.nextProductionAt === null) return production;

    let nextProductionAt = production.nextProductionAt;
    let produced = false;
    while (nextProductionAt <= now && milk >= MILK_FACTORY_MILK_COST) {
      milk -= MILK_FACTORY_MILK_COST;
      if (production.productType === "butter") {
        butter += MILK_FACTORY_PRODUCT_AMOUNT;
      } else {
        cheese += MILK_FACTORY_PRODUCT_AMOUNT;
      }
      nextProductionAt += MILK_FACTORY_INTERVAL_MS;
      produced = true;
    }
    if (!produced) return production;
    changed = true;
    return { ...production, nextProductionAt };
  });

  return changed
    ? { ...state, milk, butter, cheese, milkFactoryProductions: productions }
    : state;
}

export function normalizeMilkFactoryProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): MilkFactoryProduction[] {
  const factoryBuildingIds = buildings
    .filter((building) => building.buildingId === "milk-factory")
    .map((building) => building.id);
  const factoryBuildingIdSet = new Set(factoryBuildingIds);
  const source = Array.isArray(value) ? value : [];
  const productionsByBuildingId = new Map<string, MilkFactoryProduction>();

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<MilkFactoryProduction>;
    if (
      typeof candidate.buildingInstanceId !== "string" ||
      !factoryBuildingIdSet.has(candidate.buildingInstanceId) ||
      productionsByBuildingId.has(candidate.buildingInstanceId)
    ) {
      continue;
    }
    if (candidate.productType === null || candidate.productType === undefined) {
      productionsByBuildingId.set(candidate.buildingInstanceId, {
        buildingInstanceId: candidate.buildingInstanceId,
        productType: null,
        nextProductionAt: null,
      });
      continue;
    }
    if (!isMilkFactoryProductType(candidate.productType)) continue;
    const nextProductionAt = typeof candidate.nextProductionAt === "number" && Number.isFinite(candidate.nextProductionAt)
      ? candidate.nextProductionAt
      : now + MILK_FACTORY_INTERVAL_MS;
    productionsByBuildingId.set(candidate.buildingInstanceId, {
      buildingInstanceId: candidate.buildingInstanceId,
      productType: candidate.productType,
      nextProductionAt,
    });
  }

  const normalized = factoryBuildingIds.map((buildingInstanceId) =>
    productionsByBuildingId.get(buildingInstanceId) ?? {
      buildingInstanceId,
      productType: null,
      nextProductionAt: null,
    }
  );
  const canReuseSource =
    Array.isArray(value) &&
    source.length === normalized.length &&
    normalized.every((production, index) => production === source[index]);
  return canReuseSource ? source as MilkFactoryProduction[] : normalized;
}
