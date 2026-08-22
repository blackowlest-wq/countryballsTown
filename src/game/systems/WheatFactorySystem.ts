import {
  WHEAT_FACTORY_INTERVAL_MS,
  WHEAT_FACTORY_PRODUCT_AMOUNT,
  WHEAT_FACTORY_WHEAT_COST,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { GameState } from "../types/Village";
import type {
  WheatFactoryProduction,
  WheatFactoryProductType,
} from "../types/WheatFactory";

export type WheatFactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface WheatFactoryConfigurationResult {
  outcome: WheatFactoryConfigurationOutcome;
  state: GameState;
}

export function getWheatFactoryProductName(_productType: WheatFactoryProductType): string {
  return "小麦粉";
}

export function isWheatFactoryProductType(value: unknown): value is WheatFactoryProductType {
  return value === "wheat-flour";
}

export function registerWheatFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  if (state.wheatFactoryProductions.some(
    (production) => production.buildingInstanceId === buildingInstanceId,
  )) {
    return state;
  }
  return {
    ...state,
    wheatFactoryProductions: [
      ...state.wheatFactoryProductions,
      { buildingInstanceId, productType: null, nextProductionAt: null },
    ],
  };
}

export function removeWheatFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  const productions = state.wheatFactoryProductions.filter(
    (production) => production.buildingInstanceId !== buildingInstanceId,
  );
  return productions.length === state.wheatFactoryProductions.length
    ? state
    : { ...state, wheatFactoryProductions: productions };
}

export function configureWheatFactory(
  state: GameState,
  buildingInstanceId: string,
  productType: WheatFactoryProductType,
  now: number,
): WheatFactoryConfigurationResult {
  if (!isWheatFactoryProductType(productType)) {
    return { outcome: "invalid-product", state };
  }
  const index = state.wheatFactoryProductions.findIndex(
    (production) => production.buildingInstanceId === buildingInstanceId,
  );
  if (index < 0) return { outcome: "not-found", state };

  return {
    outcome: "configured",
    state: {
      ...state,
      wheatFactoryProductions: state.wheatFactoryProductions.map((production, productionIndex) =>
        productionIndex === index
          ? {
            ...production,
            productType,
            nextProductionAt: now + WHEAT_FACTORY_INTERVAL_MS,
          }
          : production
      ),
    },
  };
}

export function advanceWheatFactoryProductions(state: GameState, now: number): GameState {
  let wheat = state.wheat;
  let wheatFlour = state.wheatFlour;
  let changed = false;
  const productions = state.wheatFactoryProductions.map((production) => {
    if (!production.productType || production.nextProductionAt === null) return production;

    let nextProductionAt = production.nextProductionAt;
    let produced = false;
    while (nextProductionAt <= now && wheat >= WHEAT_FACTORY_WHEAT_COST) {
      wheat -= WHEAT_FACTORY_WHEAT_COST;
      wheatFlour += WHEAT_FACTORY_PRODUCT_AMOUNT;
      nextProductionAt += WHEAT_FACTORY_INTERVAL_MS;
      produced = true;
    }
    if (!produced) return production;
    changed = true;
    return { ...production, nextProductionAt };
  });

  return changed
    ? { ...state, wheat, wheatFlour, wheatFactoryProductions: productions }
    : state;
}

export function normalizeWheatFactoryProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): WheatFactoryProduction[] {
  const factoryBuildingIds = buildings
    .filter((building) => building.buildingId === "wheat-factory")
    .map((building) => building.id);
  const factoryBuildingIdSet = new Set(factoryBuildingIds);
  const source = Array.isArray(value) ? value : [];
  const productionsByBuildingId = new Map<string, WheatFactoryProduction>();

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<WheatFactoryProduction>;
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
    if (!isWheatFactoryProductType(candidate.productType)) continue;
    const nextProductionAt =
      typeof candidate.nextProductionAt === "number" && Number.isFinite(candidate.nextProductionAt)
        ? candidate.nextProductionAt
        : now + WHEAT_FACTORY_INTERVAL_MS;
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
  return canReuseSource ? source as WheatFactoryProduction[] : normalized;
}
