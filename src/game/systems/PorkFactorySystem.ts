import {
  PORK_FACTORY_INTERVAL_MS,
  PORK_FACTORY_PORK_COST,
  PORK_FACTORY_PRODUCT_AMOUNT,
} from "../constants/gameConstants";
import type { BuildingInstance } from "../types/Building";
import type { GameState } from "../types/Village";
import type {
  PorkFactoryProduction,
  PorkFactoryProductType,
} from "../types/PorkFactory";

export type PorkFactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface PorkFactoryConfigurationResult {
  outcome: PorkFactoryConfigurationOutcome;
  state: GameState;
}

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
  return value === "ham" || value === "sausage" || value === "bacon";
}

export function registerPorkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  if (state.porkFactoryProductions.some(
    (production) => production.buildingInstanceId === buildingInstanceId,
  )) {
    return state;
  }
  return {
    ...state,
    porkFactoryProductions: [
      ...state.porkFactoryProductions,
      { buildingInstanceId, productType: null, nextProductionAt: null },
    ],
  };
}

export function removePorkFactoryProduction(
  state: GameState,
  buildingInstanceId: string,
): GameState {
  const productions = state.porkFactoryProductions.filter(
    (production) => production.buildingInstanceId !== buildingInstanceId,
  );
  return productions.length === state.porkFactoryProductions.length
    ? state
    : { ...state, porkFactoryProductions: productions };
}

export function configurePorkFactory(
  state: GameState,
  buildingInstanceId: string,
  productType: PorkFactoryProductType,
  now: number,
): PorkFactoryConfigurationResult {
  if (!isPorkFactoryProductType(productType)) {
    return { outcome: "invalid-product", state };
  }
  const index = state.porkFactoryProductions.findIndex(
    (production) => production.buildingInstanceId === buildingInstanceId,
  );
  if (index < 0) return { outcome: "not-found", state };

  return {
    outcome: "configured",
    state: {
      ...state,
      porkFactoryProductions: state.porkFactoryProductions.map((production, productionIndex) =>
        productionIndex === index
          ? {
            ...production,
            productType,
            nextProductionAt: now + PORK_FACTORY_INTERVAL_MS,
          }
          : production
      ),
    },
  };
}

export function advancePorkFactoryProductions(state: GameState, now: number): GameState {
  let pork = state.pork;
  let ham = state.ham;
  let sausage = state.sausage;
  let bacon = state.bacon;
  let changed = false;
  const productions = state.porkFactoryProductions.map((production) => {
    if (!production.productType || production.nextProductionAt === null) return production;

    let nextProductionAt = production.nextProductionAt;
    let produced = false;
    while (nextProductionAt <= now && pork >= PORK_FACTORY_PORK_COST) {
      pork -= PORK_FACTORY_PORK_COST;
      if (production.productType === "ham") {
        ham += PORK_FACTORY_PRODUCT_AMOUNT;
      } else if (production.productType === "sausage") {
        sausage += PORK_FACTORY_PRODUCT_AMOUNT;
      } else {
        bacon += PORK_FACTORY_PRODUCT_AMOUNT;
      }
      nextProductionAt += PORK_FACTORY_INTERVAL_MS;
      produced = true;
    }
    if (!produced) return production;
    changed = true;
    return { ...production, nextProductionAt };
  });

  return changed
    ? {
      ...state,
      pork,
      ham,
      sausage,
      bacon,
      porkFactoryProductions: productions,
    }
    : state;
}

export function normalizePorkFactoryProductions(
  value: unknown,
  buildings: readonly BuildingInstance[],
  now: number,
): PorkFactoryProduction[] {
  const factoryBuildingIds = buildings
    .filter((building) => building.buildingId === "pork-factory")
    .map((building) => building.id);
  const factoryBuildingIdSet = new Set(factoryBuildingIds);
  const source = Array.isArray(value) ? value : [];
  const productionsByBuildingId = new Map<string, PorkFactoryProduction>();

  for (const item of source) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<PorkFactoryProduction>;
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
    if (!isPorkFactoryProductType(candidate.productType)) continue;
    const nextProductionAt =
      typeof candidate.nextProductionAt === "number" && Number.isFinite(candidate.nextProductionAt)
        ? candidate.nextProductionAt
        : now + PORK_FACTORY_INTERVAL_MS;
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
  return canReuseSource ? source as PorkFactoryProduction[] : normalized;
}
