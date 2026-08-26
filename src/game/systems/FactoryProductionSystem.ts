import type { BuildingInstance } from "../types/Building";
import type { MilkFactoryProductType } from "../types/MilkFactory";
import type { PorkFactoryProductType } from "../types/PorkFactory";
import type { WheatFactoryProductType } from "../types/WheatFactory";
import type { GameState } from "../types/Village";
import type { InventoryItemId } from "../types/Inventory";
import {
  getInventoryCount,
  setInventoryCount,
} from "./InventorySystem";
import { getBuildingProductionInterval } from "./BuildingUpgradeSystem";

export type FactoryInputKey = Extract<InventoryItemId, "milk" | "pork" | "wheat">;

export type FactoryOutputKey = Extract<
  InventoryItemId,
  "butter" | "cheese" | "ham" | "sausage" | "bacon" | "wheat-flour"
>;

export interface FactoryProductionRecord<ProductType extends string = string> {
  buildingInstanceId: string;
  productType: ProductType | null;
  nextProductionAt: number | null;
}

export type FactoryStateKey = {
  [Key in keyof GameState]-?: GameState[Key] extends FactoryProductionRecord[] ? Key : never;
}[keyof GameState] & string;

export type FactoryBuildingIdFor<ProductType extends string> =
  ProductType extends MilkFactoryProductType ? "milk-factory" :
    ProductType extends PorkFactoryProductType ? "pork-factory" :
      ProductType extends WheatFactoryProductType ? "wheat-factory" :
        "milk-factory" | "pork-factory" | "wheat-factory";

export type FactoryStateKeyFor<ProductType extends string> =
  ProductType extends MilkFactoryProductType ? "milkFactoryProductions" :
    ProductType extends PorkFactoryProductType ? "porkFactoryProductions" :
      ProductType extends WheatFactoryProductType ? "wheatFactoryProductions" :
        FactoryStateKey;

export type FactoryInputKeyFor<ProductType extends string> =
  ProductType extends MilkFactoryProductType ? "milk" :
    ProductType extends PorkFactoryProductType ? "pork" :
      ProductType extends WheatFactoryProductType ? "wheat" :
        FactoryInputKey;

export type FactoryOutputKeyFor<ProductType extends string> =
  ProductType extends "butter" ? "butter" :
    ProductType extends "cheese" ? "cheese" :
      ProductType extends "ham" ? "ham" :
        ProductType extends "sausage" ? "sausage" :
          ProductType extends "bacon" ? "bacon" :
    ProductType extends "wheat-flour" ? "wheat-flour" :
              FactoryOutputKey;

export type FactoryProductDefinition<ProductType extends string> =
  ProductType extends string
    ? { type: ProductType; outputKey: FactoryOutputKeyFor<ProductType> }
    : never;

export interface FactoryProductionDefinition<ProductType extends string> {
  buildingId: FactoryBuildingIdFor<ProductType>;
  stateKey: FactoryStateKeyFor<ProductType>;
  inputKey: FactoryInputKeyFor<ProductType>;
  inputAmount: number;
  intervalMs: number;
  productAmount: number;
  products: readonly FactoryProductDefinition<ProductType>[];
}

export type FactoryConfigurationOutcome =
  | "configured"
  | "not-found"
  | "invalid-product";

export interface FactoryConfigurationResult {
  outcome: FactoryConfigurationOutcome;
  state: GameState;
}

export interface FactoryProductionModule<ProductType extends string> {
  register(state: GameState, buildingInstanceId: string): GameState;
  remove(state: GameState, buildingInstanceId: string): GameState;
  configure(
    state: GameState,
    buildingInstanceId: string,
    productType: unknown,
    now: number,
  ): FactoryConfigurationResult;
  isProductType(value: unknown): value is ProductType;
  advance(state: GameState, now: number): GameState;
  normalize(
    value: unknown,
    buildings: readonly BuildingInstance[],
    now: number,
  ): FactoryProductionRecord<ProductType>[];
}

function getProductions<ProductType extends string>(
  state: GameState,
  definition: FactoryProductionDefinition<ProductType>,
): FactoryProductionRecord<ProductType>[] {
  return state[definition.stateKey] as unknown as FactoryProductionRecord<ProductType>[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasOnlyFactoryProductionKeys(value: object): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === 3 && keys.every((key, index) =>
    key === ["buildingInstanceId", "nextProductionAt", "productType"].sort()[index]
  );
}

export function createFactoryProductionModule<ProductType extends string>(
  definition: FactoryProductionDefinition<ProductType>,
): FactoryProductionModule<ProductType> {
  const isProductType = (value: unknown): value is ProductType =>
    definition.products.some((product) => product.type === value);

  const normalize = (
    value: unknown,
    buildings: readonly BuildingInstance[],
    now: number,
  ): FactoryProductionRecord<ProductType>[] => {
    const buildingIds = buildings
      .filter((building) => building.buildingId === definition.buildingId)
      .map((building) => building.id);
    const buildingIdSet = new Set(buildingIds);
    const source = Array.isArray(value) ? value : [];
    const productionsByBuildingId = new Map<
      string,
      FactoryProductionRecord<ProductType>
    >();

    for (const item of source) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as Partial<FactoryProductionRecord<ProductType>>;
      if (
        typeof candidate.buildingInstanceId !== "string" ||
        !buildingIdSet.has(candidate.buildingInstanceId) ||
        productionsByBuildingId.has(candidate.buildingInstanceId)
      ) {
        continue;
      }

      if (candidate.productType === null || candidate.productType === undefined) {
        const isCanonical =
          candidate.productType === null &&
          candidate.nextProductionAt === null &&
          hasOnlyFactoryProductionKeys(item);
        productionsByBuildingId.set(
          candidate.buildingInstanceId,
          isCanonical
            ? item as FactoryProductionRecord<ProductType>
            : {
              buildingInstanceId: candidate.buildingInstanceId,
              productType: null,
              nextProductionAt: null,
            },
        );
        continue;
      }

      if (!isProductType(candidate.productType)) continue;
      const nextProductionAt = isFiniteNumber(candidate.nextProductionAt)
        ? candidate.nextProductionAt
        : now + definition.intervalMs;
      const isCanonical =
        isFiniteNumber(candidate.nextProductionAt) &&
        hasOnlyFactoryProductionKeys(item);
      productionsByBuildingId.set(
        candidate.buildingInstanceId,
        isCanonical
          ? item as FactoryProductionRecord<ProductType>
          : {
            buildingInstanceId: candidate.buildingInstanceId,
            productType: candidate.productType,
            nextProductionAt,
          },
      );
    }

    const normalized = buildingIds.map((buildingInstanceId) =>
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
    return canReuseSource
      ? source as FactoryProductionRecord<ProductType>[]
      : normalized;
  };

  return {
    register: (state, buildingInstanceId) => {
      const productions = getProductions(state, definition);
      if (productions.some((production) => production.buildingInstanceId === buildingInstanceId)) {
        return state;
      }
      return {
        ...state,
        [definition.stateKey]: [
          ...productions,
          { buildingInstanceId, productType: null, nextProductionAt: null },
        ],
      } as GameState;
    },

    remove: (state, buildingInstanceId) => {
      const productions = getProductions(state, definition);
      const nextProductions = productions.filter(
        (production) => production.buildingInstanceId !== buildingInstanceId,
      );
      return nextProductions.length === productions.length
        ? state
        : { ...state, [definition.stateKey]: nextProductions } as GameState;
    },

    configure: (state, buildingInstanceId, productType, now) => {
      if (!isProductType(productType)) {
        return { outcome: "invalid-product", state };
      }
      const productions = getProductions(state, definition);
      const index = productions.findIndex(
        (production) => production.buildingInstanceId === buildingInstanceId,
      );
      if (index < 0) return { outcome: "not-found", state };

      return {
        outcome: "configured",
        state: {
          ...state,
          [definition.stateKey]: productions.map((production, productionIndex) =>
            productionIndex === index
              ? {
                ...production,
                productType,
                nextProductionAt: now + getBuildingProductionInterval(
                  state,
                  buildingInstanceId,
                  definition.intervalMs,
                ),
              }
              : production
          ),
        } as GameState,
      };
    },

    isProductType,

    advance: (state, now) => {
      const productions = getProductions(state, definition);
      let input = getInventoryCount(state, definition.inputKey);
      const outputChanges: Partial<Record<FactoryOutputKey, number>> = {};
      let changed = false;
      const nextProductions = productions.map((production) => {
        if (!production.productType || production.nextProductionAt === null) {
          return production;
        }

        const product = definition.products.find(
          (candidate) => candidate.type === production.productType,
        ) ?? definition.products[definition.products.length - 1];
        if (!product) return production;

        const intervalMs = getBuildingProductionInterval(
          state,
          production.buildingInstanceId,
          definition.intervalMs,
        );
        let nextProductionAt = production.nextProductionAt;
        let produced = false;
        while (nextProductionAt <= now && input >= definition.inputAmount) {
          input -= definition.inputAmount;
          outputChanges[product.outputKey] =
            (outputChanges[product.outputKey] ?? getInventoryCount(state, product.outputKey)) +
            definition.productAmount;
          nextProductionAt += intervalMs;
          produced = true;
        }
        if (!produced) return production;
        changed = true;
        return { ...production, nextProductionAt };
      });

      if (!changed) return state;
      let nextState = setInventoryCount(state, definition.inputKey, input);
      for (const [outputKey, amount] of Object.entries(outputChanges) as Array<[
        FactoryOutputKey,
        number,
      ]>) {
        nextState = setInventoryCount(nextState, outputKey, amount);
      }
      return {
        ...nextState,
        [definition.stateKey]: nextProductions,
      } as GameState;
    },

    normalize,
  };
}
